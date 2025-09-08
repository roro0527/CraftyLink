/**
 * @fileOverview Firebase Cloud Function to get top YouTube videos for a given location.
 *
 * This file defines an HTTP endpoint `/getTopVideos` which takes latitude and
 * longitude, determines the city using the Kakao API, fetches relevant
 * YouTube videos, and returns them. It includes Firestore-based caching,
 * rate limiting, and robust error handling.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import axios from "axios";
import { google } from "googleapis";
import rateLimit from "express-rate-limit";

// Initialize Firebase Admin SDK
admin.initializeApp();
const firestore = admin.firestore();

const app = express();

// Enable CORS for all origins
app.use(cors({ origin: true }));

// Basic rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    functions.logger.warn("Rate limit exceeded for IP:", req.ip);
    res.status(429).send({ error: "Too many requests, please try again later." });
  },
});

app.use("/getTopVideos", limiter);

const youtube = google.youtube({
  version: "v3",
  auth: functions.config().youtube.key,
});

const KAKAO_API_KEY = functions.config().kakao.key;
const CACHE_TTL_MINUTES = parseInt(functions.config().cache?.ttl_minutes || "10", 10);

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
        // This is a graceful fallback. If the API fails, we return an empty list
        // instead of crashing the whole function. The caller should handle the empty list.
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

export const api = functions.region("asia-northeast3").https.onRequest(app);
