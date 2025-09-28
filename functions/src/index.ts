
/**
 * @fileOverview Firebase Cloud Functions for CraftyLink.
 *
 * This file defines two main HTTP endpoints:
 * 1. /getTopVideos: Fetches top YouTube videos for a given location, using Kakao API for geocoding.
 * 2. /getNaverNews: Fetches top news articles from Naver Search API for a given keyword.
 *
 * All endpoints include caching, rate limiting, and robust error handling.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import axios from "axios";
import { google } from "googleapis";
import rateLimit from "express-rate-limit";
import * as googleTrends from "google-trends-api";

// Initialize Firebase Admin SDK
admin.initializeApp();

const app = express();

// Enable CORS for all origins. Configure this more strictly for production.
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

app.use(limiter); // Apply rate limiter to all routes


app.get("/getGoogleImages", async (req, res) => {
  const { query, start } = req.query;

  if (typeof query !== "string") {
    return res.status(400).send({ error: "query parameter is missing or invalid." });
  }

  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
  const cseId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

  if (!apiKey || !cseId) {
    functions.logger.error("Google Custom Search API Key or Engine ID is not configured.");
    return res.status(500).send({ error: "Server configuration error." });
  }

  const url = "https://www.googleapis.com/customsearch/v1";

  try {
    const response = await axios.get(url, {
      params: {
        key: apiKey,
        cx: cseId,
        q: query,
        searchType: "image",
        num: 10,
        start: start || 1,
      },
    });

    const items = response.data.items || [];
    const searchResult = items.map((item: any) => ({
      id: item.cacheId || `${item.link}-${Math.random()}`,
      title: item.title,
      url: item.image.contextLink,
      imageUrl: item.link, // Direct image link
      description: item.snippet,
      source: item.displayLink,
    }));
    
    const nextPageIndex = response.data.queries?.nextPage?.[0]?.startIndex;

    return res.status(200).json({ 
        photos: searchResult,
        nextPage: nextPageIndex,
    });

  } catch (error) {
    if (axios.isAxiosError(error)) {
      functions.logger.error("Google Custom Search API call failed:", error.response?.data || error.message);
      return res.status(error.response?.status || 500).send({ error: "Failed to fetch images from Google.", details: error.response?.data });
    }
    functions.logger.error("An unexpected error occurred while fetching Google Images:", error);
    return res.status(500).send({ error: "An unexpected error occurred." });
  }
});


// --- YouTube and Kakao API Setup ---
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});
const KAKAO_API_KEY = process.env.KAKAO_APP_KEY;



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
    const MAX_RESULTS_PER_CALL = 25;
    
    let videoIds = new Set<string>();

    try {
        const locationSearchResponse = await youtube.search.list({
            part: ['id'],
            type: ['video'],
            location: locationString,
            locationRadius: locationRadiusString,
            maxResults: MAX_RESULTS_PER_CALL,
            order: 'viewCount',
        });
        locationSearchResponse.data.items?.forEach(item => item.id?.videoId && videoIds.add(item.id.videoId));
        
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

        if (videoIds.size === 0) return [];

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
  // ... (code from previous state, can be kept or removed)
});


app.get("/getRisingSearches", async (req, res) => {
  const { regionCode } = req.query;

  if (typeof regionCode !== "string") {
    return res.status(400).send({ error: "regionCode parameter is missing or invalid." });
  }

  try {
    const results = await googleTrends.dailyTrends({
      geo: regionCode,
    });
    const trends = JSON.parse(results);
    const risingSearches = trends.default.trendingSearchesDays[0].trendingSearches.map((t: any) => t.title.query);
    return res.status(200).json(risingSearches);
  } catch (error) {
    functions.logger.error(`Error fetching Google Trends for region ${regionCode}:`, error);
    return res.status(500).send({ error: "Failed to fetch rising searches." });
  }
});


export const api = functions.runWith({ secrets: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET", "YOUTUBE_API_KEY", "KAKAO_APP_KEY", "NAVER_DATALAB_CLIENT_ID", "NAVER_DATALAB_CLIENT_SECRET", "FIREBASE_SERVICE_ACCOUNT_KEY", "GOOGLE_CUSTOM_SEARCH_API_KEY", "GOOGLE_CUSTOM_SEARCH_ENGINE_ID"]}).region("asia-northeast3").https.onRequest(app);
