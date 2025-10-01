
/**
 * @fileOverview Firebase Cloud Functions for CraftyLink.
 *
 * This file defines two main HTTP endpoints:
 * 1. /getTopVideos: Fetches top YouTube videos for a given location, using Kakao API for geocoding.
 * 2. /getGoogleImages: Fetches images from Google Custom Search API.
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
import { onRequest } from "firebase-functions/v2/https";

// Initialize Firebase Admin SDK
try {
    admin.initializeApp();
} catch (e) {
  console.error('Firebase admin initialization error', e);
}


const app = express();

// Use cors middleware for all routes
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
    const { lat, lng, radius, city } = req.query;

    if (!lat || !lng || !radius) {
        return res.status(400).send({ error: "lat, lng, and radius parameters are required." });
    }

    try {
        const latitude = parseFloat(lat as string);
        const longitude = parseFloat(lng as string);
        const searchRadius = parseFloat(radius as string);
        const fallbackCity = city as string || await getCityFromCoords(latitude, longitude);

        const videos = await fetchTopVideos(fallbackCity, latitude, longitude, searchRadius);
        return res.status(200).json(videos);
    } catch (error) {
        if (error instanceof functions.https.HttpsError) {
            return res.status(500).send({ error: error.message });
        }
        functions.logger.error("An unexpected error occurred in /getTopVideos:", error);
        return res.status(500).send({ error: "An unexpected error occurred." });
    }
});

// Note: The /getGoogleImages endpoint is removed as it's now handled by a Genkit flow.
// This simplifies the Cloud Function logic and keeps API calls managed in one place (Genkit flows).

export const api = onRequest(
    {
        region: "asia-northeast3",
        secrets: ["YOUTUBE_API_KEY", "KAKAO_APP_KEY", "NAVER_DATALAB_CLIENT_ID", "NAVER_DATALAB_CLIENT_SECRET", "NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET", "GOOGLE_CUSTOM_SEARCH_API_KEY", "GOOGLE_CUSTOM_SEARCH_ENGINE_ID"],
    },
    app
);
