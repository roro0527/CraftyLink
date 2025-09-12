/**
 * @fileOverview Firebase Cloud Functions for CraftyLink.
 *
 * This file defines two main HTTP endpoints:
 * 1. /getTopVideos: Fetches top YouTube videos for a given location, using Kakao API for geocoding.
 * 2. /getNaverNews: Fetches top news articles from Naver Search API for a given keyword.
 *
 * Both endpoints include caching, rate limiting, and robust error handling.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import axios from "axios";
import { google } from "googleapis";
import rateLimit from "express-rate-limit";
import { fetchNaverNewsLogic } from "./naver-news";

// Initialize Firebase Admin SDK
admin.initializeApp();
const firestore = admin.firestore();

const app = express();

// Enable CORS for all origins
app.use(cors({ origin: true }));

// Basic rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    functions.logger.warn("Rate limit exceeded for IP:", req.ip);
    res.status(429).send({ error: "Too many requests, please try again later." });
  },
});

app.use("/getTopVideos", limiter);
app.use("/getNaverNews", limiter);


// --- YouTube and Kakao API Setup ---
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});
const KAKAO_API_KEY = process.env.KAKAO_APP_KEY;


// --- Naver API Setup ---
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

// --- Cache Configuration ---
const CACHE_TTL_MINUTES = 10;


/**
 * Fetches the city name from geographic coordinates using Kakao's coord2address API.
 * @param {number} lat - The latitude.
 * @param {number} lng - The longitude.
 * @returns {Promise<string>} The name of the city (e.g., "서울특별시").
 */
async function getCityFromCoords(lat: number, lng: number): Promise<string> {
  const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`;
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
    });
    if (response.data.documents && response.data.documents.length > 0) {
      const address = response.data.documents[0].address;
      // 'region_1depth_name' usually corresponds to the city or province.
      return address.region_1depth_name;
    }
    throw new Error("No address found for the given coordinates.");
  } catch (error) {
    functions.logger.error("Kakao API call failed:", error);
    throw new functions.https.HttpsError("internal", "Failed to resolve location from coordinates.");
  }
}

/**
 * Fetches top YouTube videos based on location and a fallback query.
 * @param {string} city - The city name to use as a fallback query.
 * @param {number} lat - The latitude for location-based search.
 * @param {number} lng - The longitude for location-based search.
 * @param {number} radius - The search radius in kilometers.
 * @returns {Promise<any[]>} A list of video items with snippet and statistics.
 */
async function fetchTopVideos(city: string, lat: number, lng: number, radius: number): Promise<any[]> {
    const locationString = `${lat},${lng}`;
    const locationRadiusString = `${radius}km`;
    const MAX_RESULTS_PER_CALL = 25; // YouTube API max is 50, but we split to get diverse results
    
    let videoIds = new Set<string>();

    try {
        // 1. First Pass: Location-based search
        const locationSearchResponse = await youtube.search.list({
            part: ['id'],
            type: ['video'],
            location: locationString,
            locationRadius: locationRadiusString,
            maxResults: MAX_RESULTS_PER_CALL,
            order: 'viewCount',
        });
        locationSearchResponse.data.items?.forEach(item => item.id?.videoId && videoIds.add(item.id.videoId));
        
        // 2. Second Pass (if needed): Fallback to city name query
        if (videoIds.size < MAX_RESULTS_PER_CALL) {
            const citySearchResponse = await youtube.search.list({
                part: ['id'],
                type: ['video'],
                q: `${city} 인기 영상`,
                maxResults: MAX_RESULTS_PER_CALL - videoIds.size,
                order: 'relevance',
            });
            citySearchResponse.data.items?.forEach(item => item.id?.videoId && videoIds.add(item.id.videoId));
        }

        if (videoIds.size === 0) {
            return [];
        }

        // 3. Final Pass: Get video details (snippet, statistics) for all collected IDs
        const videoDetailsResponse = await youtube.videos.list({
            part: ['snippet', 'statistics'],
            id: Array.from(videoIds),
            maxResults: 50,
        });

        return videoDetailsResponse.data.items || [];

    } catch (error) {
        functions.logger.error("YouTube Data API call failed:", error);
        return [];
    }
}

app.get("/getTopVideos", async (req, res) => {
  const { lat, lng, radius } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: "Missing required query parameters: lat, lng" });
  }

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);
  const searchRadius = parseFloat((radius as string) || "10"); // Default 10km

  if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: "Invalid lat/lng values." });
  }

  try {
    const city = await getCityFromCoords(latitude, longitude);
    const cacheRef = firestore.collection("cities").doc(city);
    const cacheDoc = await cacheRef.get();

    if (cacheDoc.exists) {
      const cacheData = cacheDoc.data()!;
      const now = admin.firestore.Timestamp.now();
      const diffMinutes = (now.seconds - cacheData.updatedAt.seconds) / 60;

      if (diffMinutes < CACHE_TTL_MINUTES) {
        functions.logger.info(`Returning cached data for city: ${city}`);
        return res.status(200).json({
          city,
          source: "cache",
          cached: true,
          items: cacheData.videos,
        });
      }
    }
    
    functions.logger.info(`Cache miss or expired for city: ${city}. Fetching fresh data.`);
    const videos = await fetchTopVideos(city, latitude, longitude, searchRadius);

    if (videos.length > 0) {
        const newCacheData = {
            videos,
            updatedAt: admin.firestore.Timestamp.now(),
        };
        await cacheRef.set(newCacheData);
        functions.logger.info(`Successfully cached data for city: ${city}`);
    }

    return res.status(200).json({
      city,
      source: "api",
      cached: false,
      items: videos,
    });

  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) {
      return res.status(500).json({ error: error.message });
    }
    functions.logger.error("Unhandled error in /getTopVideos:", error);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
});

app.get("/getNaverNews", async (req, res) => {
    const { query } = req.query;
    if (typeof query !== 'string' || !query) {
        return res.status(400).send({ error: "Missing or invalid required query parameter: query" });
    }
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        functions.logger.error("Naver API credentials are not set in the environment.");
        return res.status(500).send({ error: "Server configuration error: Naver API credentials missing." });
    }
    try {
        const articles = await fetchNaverNewsLogic(query, firestore, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET);
        return res.status(200).json(articles);
    } catch (error: any) {
        functions.logger.error(`Error in /getNaverNews endpoint for query "${query}":`, error);
        // Provide a more specific error message if available
        const message = error.message || "An unexpected error occurred while fetching news.";
        // Determine status code based on error type if possible
        const statusCode = error.isAxiosError ? error.response?.status || 500 : 500;
        return res.status(statusCode).send({ error: message });
    }
});


export const api = functions.runWith({ secrets: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET", "YOUTUBE_API_KEY", "KAKAO_APP_KEY"]}).region("asia-northeast3").https.onRequest(app);
