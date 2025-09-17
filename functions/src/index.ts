
/**
 * @fileOverview Firebase Cloud Functions for CraftyLink.
 *
 * This file defines two main HTTP endpoints:
 * 1. /getTopVideos: Fetches top YouTube videos for a given location, using Kakao API for geocoding.
 * 2. /getNaverNews: Fetches top news articles from Naver Search API for a given keyword.
 * 3. /getNaverData: A comprehensive endpoint to fetch various trend data from Naver Datalab API.
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
const NAVER_DATALAB_ID = functions.config().naver?.datalab_id || process.env.NAVER_DATALAB_CLIENT_ID;
const NAVER_DATALAB_SECRET = functions.config().naver?.datalab_secret || process.env.NAVER_DATALAB_CLIENT_SECRET;

// --- Cache Configuration ---
const CACHE_TTL_HOURS = 24;


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

// Helper for caching
const withCache = async (cacheKey: string, fetchFn: () => Promise<any>) => {
    const cacheRef = firestore.collection("naverDatalabCache").doc(cacheKey);
    const doc = await cacheRef.get();
    if (doc.exists) {
        const data = doc.data()!;
        const ageHours = (Date.now() - data.timestamp) / 3600000;
        if (ageHours < CACHE_TTL_HOURS) {
            functions.logger.info(`[Cache] HIT for ${cacheKey}`);
            return data.result;
        }
    }
    functions.logger.info(`[Cache] MISS for ${cacheKey}`);
    const result = await fetchFn();
    await cacheRef.set({ result, timestamp: Date.now() });
    return result;
};


// Generic Naver Datalab API caller
const callNaverDatalabAPI = async (endpoint: string, body: any) => {
    const url = `https://openapi.naver.com/v1/datalab/${endpoint}`;
    const response = await axios.post(url, body, {
        headers: {
            'X-Naver-Client-Id': NAVER_DATALAB_ID,
            'X-Naver-Client-Secret': NAVER_DATALAB_SECRET,
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};

// --- API Logic Handlers ---

const handleGenderAge = (payload: any) => {
    const { keyword } = payload;
    const body = { startDate: "2023-01-01", endDate: new Date().toISOString().split('T')[0], timeUnit: 'month', keyword, category: "50000001" };
    return callNaverDatalabAPI('shopping-insight/category/keyword/gender-age', body).then(d => d.results[0]);
};

const handleSeasonal = (payload: any) => {
    const { keyword } = payload;
    const body = { startDate: "2023-01-01", endDate: new Date().toISOString().split('T')[0], timeUnit: 'month', keyword, category: "50000001" };
    return callNaverDatalabAPI('shopping-insight/category/keyword/seasonal', body).then(d => d.results[0].data);
};

const handleMultiKeyword = async (payload: any) => {
    const { keywords } = payload;
    const body = { startDate: "2023-01-01", endDate: new Date().toISOString().split('T')[0], timeUnit: 'date', keywordGroups: keywords.map((k: string) => ({ groupName: k, keywords: [k] })) };
    const data = await callNaverDatalabAPI('search', body);
    
    // Re-format data for easier chart consumption
    const unifiedData: { [period: string]: { period: string; [key: string]: number } } = {};
    data.results.forEach((result: any) => {
        const keywordName = result.title;
        result.data.forEach((point: { period: string; ratio: number }) => {
            if (!unifiedData[point.period]) {
                unifiedData[point.period] = { period: point.period };
            }
            unifiedData[point.period][keywordName] = point.ratio;
        });
    });
    return Object.values(unifiedData);
};


const handleCategory = async (payload: any) => {
    const { categories } = payload;
    const body = { startDate: "2023-01-01", endDate: new Date().toISOString().split('T')[0], timeUnit: 'date', category: categories.map((c: any) => ({ name: c.name, param: c.param })) };
    const data = await callNaverDatalabAPI('shopping-insight/category/trend', body);

    const unifiedData: { [period: string]: { period: string; [key: string]: number } } = {};
     data.results.forEach((result: any) => {
        const categoryName = result.title;
        result.data.forEach((point: { period: string; ratio: number }) => {
            if (!unifiedData[point.period]) {
                unifiedData[point.period] = { period: point.period };
            }
            unifiedData[point.period][categoryName] = point.ratio;
        });
    });
    return Object.values(unifiedData);
};


const handleRisingFalling = async () => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
    const prevEndDate = startDate;
    const prevStartDate = new Date(new Date().setDate(new Date(startDate).getDate() - 30)).toISOString().split('T')[0];

    const category = "50000000"; // 패션 전체
    const timeUnit = "date";
    const device = "";
    const gender = "";
    const ages = [] as string[];

    const fetchRank = (startDate: string, endDate: string) => callNaverDatalabAPI('shopping-insight/category/keyword/rank', {
        startDate,
        endDate,
        timeUnit,
        category,
        device,
        gender,
        ages,
        page: 1,
        count: 500
    });

    try {
        const [currentMonthData, prevMonthData] = await Promise.all([
            fetchRank(startDate, endDate),
            fetchRank(prevStartDate, prevEndDate)
        ]);

        const currentRanks: { [keyword: string]: number } = {};
        currentMonthData.results[0].data.forEach((item: { keyword: string, rank: number }) => {
            currentRanks[item.keyword] = item.rank;
        });

        const prevRanks: { [keyword: string]: number } = {};
        prevMonthData.results[0].data.forEach((item: { keyword: string, rank: number }) => {
            prevRanks[item.keyword] = item.rank;
        });
        
        const rankChanges: { keyword: string, change: number }[] = [];
        
        // Calculate rank changes for all keywords present in the current month
        for (const keyword in currentRanks) {
            const currentRank = currentRanks[keyword];
            const prevRank = prevRanks[keyword] || 501; // Not ranked in prev month is treated as rank 501
            rankChanges.push({ keyword, change: prevRank - currentRank });
        }

        // Sort by change (desc for rising, asc for falling)
        rankChanges.sort((a, b) => b.change - a.change);

        const rising = rankChanges.slice(0, 3);
        const falling = rankChanges.filter(k => k.change < 0).slice(-3).reverse();

        return { rising, falling };

    } catch (error) {
        functions.logger.error("Error in handleRisingFalling:", error);
        // Return empty arrays in case of an error
        return { rising: [], falling: [] };
    }
};


app.post("/getNaverData", async (req, res) => {
    const { type, payload } = req.body;
    if (!type) {
        return res.status(400).json({ error: "Missing 'type' in request body." });
    }

    try {
        const cacheKey = `${type}-${JSON.stringify(payload || {}).replace(/[^a-zA-Z0-9]/g, '')}`;
        let result;

        const handler = {
            genderAge: () => handleGenderAge(payload),
            seasonal: () => handleSeasonal(payload),
            multiKeyword: () => handleMultiKeyword(payload),
            category: () => handleCategory(payload),
            risingFalling: () => handleRisingFalling(),
        }[type];
        
        if (!handler) {
            return res.status(400).json({ error: `Invalid analysis type: ${type}` });
        }
        
        // Disable cache for rising/falling as it should be dynamic
        if (type === 'risingFalling') {
            result = await handler();
        } else {
            result = await withCache(cacheKey, handler);
        }
        
        return res.status(200).json(result);

    } catch (error: any) {
        functions.logger.error(`Error in /getNaverData for type "${type}":`, error.response?.data || error.message);
        const message = error.response?.data?.errorMessage || "An unexpected error occurred.";
        return res.status(500).json({ error: message });
    }
});


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
        const articles = await fetchNaverNewsLogic(query, firestore, NAVER_CLIENT_ID, NAVER_CLIENT_SECRET);
        return res.status(200).json(articles);
    } catch (error: any) {
        functions.logger.error("Error fetching Naver news:", error);
        return res.status(500).send({ error: "Failed to fetch news." });
    }
});


export const api = functions.runWith({ secrets: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET", "YOUTUBE_API_KEY", "KAKAO_APP_KEY", "NAVER_DATALAB_CLIENT_ID", "NAVER_DATALAB_CLIENT_SECRET", "FIREBASE_SERVICE_ACCOUNT_KEY"]}).region("asia-northeast3").https.onRequest(app);

// Clean up old function exports if they are no longer used
// export { getNaverNews, getTopVideos };

    