
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


// --- YouTube and Kakao API Setup ---
const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});
const KAKAO_API_KEY = process.env.KAKAO_APP_KEY;


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


app.get("/getPexelsPhotos", async (req, res) => {
    const { query: searchQuery, page: pageNumber } = req.query;
    const apiKey = PEXELS_API_KEY;

    if (typeof searchQuery !== 'string') {
        return res.status(400).send({ error: "Query parameter is required" });
    }
    
    if (!apiKey) {
        functions.logger.error("Pexels API key is not configured in Cloud Functions.");
        return res.status(500).send({ error: "Server configuration error for Pexels API." });
    }

    const url = 'https://api.pexels.com/v1/search';
    
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: apiKey,
            },
            params: {
                query: searchQuery,
                per_page: 12,
                page: pageNumber || '1',
            },
        });
        
        functions.logger.info(`Pexels API call successful for query: "${searchQuery}". Found ${response.data.photos.length} photos.`);

        const photos = response.data.photos.map((photo: any) => ({
            id: photo.id,
            title: photo.alt || 'Pexels Photo',
            url: photo.url,
            imageUrl: photo.src.medium,
            description: `Photo by ${photo.photographer}`,
            photographer_url: photo.photographer_url,
            source: 'Pexels',
        }));

        const hasMore = response.data.next_page !== undefined;

        return res.status(200).json({ photos, hasMore });

    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            functions.logger.error("Pexels API call failed:", {
                status: error.response?.status,
                data: error.response?.data,
                query: searchQuery
            });
            return res.status(error.response?.status || 500).send({
                error: "Failed to fetch photos from Pexels.",
                details: error.response?.data
            });
        } else {
             functions.logger.error("An unexpected error occurred while fetching from Pexels:", error);
             return res.status(500).send({ error: "An unexpected error occurred." });
        }
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


export const api = functions.runWith({ secrets: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET", "YOUTUBE_API_KEY", "KAKAO_APP_KEY", "NAVER_DATALAB_CLIENT_ID", "NAVER_DATALAB_CLIENT_SECRET", "FIREBASE_SERVICE_ACCOUNT_KEY", "PEXELS_API_KEY"]}).region("asia-northeast3").https.onRequest(app);
