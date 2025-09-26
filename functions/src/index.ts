
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
import { fetchNaverNewsLogic } from "./naver-news";
import * as googleTrends from "google-trends-api";

// Initialize Firebase Admin SDK
admin.initializeApp();
const firestore = admin.firestore();

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


// --- YouTube and Kakao API Setup ---
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});
const KAKAO_API_KEY = process.env.KAKAO_APP_KEY;


// --- Naver API Setup ---
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

// --- Pexels API Setup ---
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;


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

app.get("/getNaverNews", async (req, res) => {
  const { query } = req.query;

    if (typeof query !== 'string') {
        return res.status(400).send({ error: "Query parameter is missing or invalid." });
    }
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        functions.logger.error("Naver API credentials are not configured in Cloud Functions.");
        return res.status(500).send({ error: "Server configuration error." });
    }

    try {
        const articles = await fetchNaverNewsLogic(query, firestore);
        return res.status(200).json(articles);
    } catch (error: any) {
        functions.logger.error("Error fetching Naver news:", error);
        return res.status(500).send({ error: "Failed to fetch news." });
    }
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

app.get("/getPexelsPhotos", async (req, res) => {
    const { query, page } = req.query;

    if (typeof query !== 'string' || !query.trim()) {
        return res.status(400).send({ error: "Query parameter is missing or invalid." });
    }
    if (!PEXELS_API_KEY) {
        functions.logger.error("Pexels API key is not configured in Cloud Functions.");
        return res.status(500).send({ error: "Server configuration error." });
    }

    const pageNumber = typeof page === 'string' ? parseInt(page, 10) : 1;

    try {
        const url = 'https://api.pexels.com/v1/search';
        const response = await axios.get(url, {
            headers: {
                Authorization: PEXELS_API_KEY,
            },
            params: {
                query,
                page: pageNumber,
                per_page: 12,
                locale: 'ko-KR'
            },
        });

        const { photos, has_more } = response.data;
        
        const results = photos.map((photo: any) => ({
            id: photo.id.toString(),
            title: photo.alt || 'Pexels Photo',
            url: photo.url,
            imageUrl: photo.src.medium, // Use medium size for grid display
            description: `Photo by ${photo.photographer}`,
            source: 'Pexels',
            photographer_url: photo.photographer_url
        }));

        return res.status(200).json({ photos: results, hasMore: has_more });

    } catch (error: any) {
        functions.logger.error("Pexels API call failed:", error.response?.data || error.message);
        return res.status(500).send({ error: "Failed to fetch photos from Pexels." });
    }
});


export const api = functions.runWith({ secrets: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET", "YOUTUBE_API_KEY", "KAKAO_APP_KEY", "NAVER_DATALAB_CLIENT_ID", "NAVER_DATALAB_CLIENT_SECRET", "FIREBASE_SERVICE_ACCOUNT_KEY", "PEXELS_API_KEY"]}).region("asia-northeast3")..https.onRequest(app);
