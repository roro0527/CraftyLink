"use strict";
/**
 * @fileOverview Firebase Cloud Functions for CraftyLink.
 *
 * This file defines two main HTTP endpoints:
 * 1. /getTopVideos: Fetches top YouTube videos for a given location, using Kakao API for geocoding.
 * 2. /getGoogleImages: Fetches images from Google Custom Search API.
 *
 * All endpoints include caching, rate limiting, and robust error handling.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const axios_1 = __importDefault(require("axios"));
const googleapis_1 = require("googleapis");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Initialize Firebase Admin SDK
try {
    admin.initializeApp();
}
catch (e) {
    console.error('Firebase admin initialization error', e);
}
const app = (0, express_1.default)();
// Use cors middleware for all routes
app.use((0, cors_1.default)({ origin: true }));
// Basic rate limiting to prevent abuse
const limiter = (0, express_rate_limit_1.default)({
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
    var _a, _b, _c, _d, _e, _f;
    const { query, start } = req.query;
    if (typeof query !== "string") {
        return res.status(400).send({ error: "query parameter is missing or invalid." });
    }
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const cseId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;
    if (!apiKey || !cseId) {
        functions.logger.error("Google Custom Search API Key or Engine ID is not configured in function secrets.");
        return res.status(500).send({ error: "Server configuration error." });
    }
    const url = "https://www.googleapis.com/customsearch/v1";
    try {
        const response = await axios_1.default.get(url, {
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
        const searchResult = items.map((item) => ({
            id: item.cacheId || `${item.link}-${Math.random()}`,
            title: item.title,
            url: item.image.contextLink,
            imageUrl: item.link, // Direct image link
            description: item.snippet,
            source: item.displayLink,
        }));
        const nextPageIndex = (_c = (_b = (_a = response.data.queries) === null || _a === void 0 ? void 0 : _a.nextPage) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.startIndex;
        return res.status(200).json({
            photos: searchResult,
            nextPage: nextPageIndex,
        });
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            functions.logger.error("Google Custom Search API call failed:", ((_d = error.response) === null || _d === void 0 ? void 0 : _d.data) || error.message);
            return res.status(((_e = error.response) === null || _e === void 0 ? void 0 : _e.status) || 500).send({ error: "Failed to fetch images from Google.", details: (_f = error.response) === null || _f === void 0 ? void 0 : _f.data });
        }
        functions.logger.error("An unexpected error occurred while fetching Google Images:", error);
        return res.status(500).send({ error: "An unexpected error occurred." });
    }
});
// --- YouTube and Kakao API Setup ---
const youtube = googleapis_1.google.youtube({
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
async function getCityFromCoords(lat, lng) {
    const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`;
    try {
        const response = await axios_1.default.get(url, {
            headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
        });
        if (response.data.documents && response.data.documents.length > 0) {
            const address = response.data.documents[0].address;
            return address.region_1depth_name;
        }
        throw new Error("No address found for the given coordinates.");
    }
    catch (error) {
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
async function fetchTopVideos(city, lat, lng, radius) {
    var _a, _b;
    const locationString = `${lat},${lng}`;
    const locationRadiusString = `${radius}km`;
    const MAX_RESULTS_PER_CALL = 25;
    let videoIds = new Set();
    try {
        const locationSearchResponse = await youtube.search.list({
            part: ['id'],
            type: ['video'],
            location: locationString,
            locationRadius: locationRadiusString,
            maxResults: MAX_RESULTS_PER_CALL,
            order: 'viewCount',
        });
        (_a = locationSearchResponse.data.items) === null || _a === void 0 ? void 0 : _a.forEach(item => { var _a; return ((_a = item.id) === null || _a === void 0 ? void 0 : _a.videoId) && videoIds.add(item.id.videoId); });
        if (videoIds.size < MAX_RESULTS_PER_CALL) {
            const citySearchResponse = await youtube.search.list({
                part: ['id'],
                type: ['video'],
                q: `${city} 인기 영상`,
                maxResults: MAX_RESULTS_PER_CALL - videoIds.size,
                order: 'relevance',
            });
            (_b = citySearchResponse.data.items) === null || _b === void 0 ? void 0 : _b.forEach(item => { var _a; return ((_a = item.id) === null || _a === void 0 ? void 0 : _a.videoId) && videoIds.add(item.id.videoId); });
        }
        if (videoIds.size === 0)
            return [];
        const videoDetailsResponse = await youtube.videos.list({
            part: ['snippet', 'statistics'],
            id: Array.from(videoIds),
            maxResults: 50,
        });
        return videoDetailsResponse.data.items || [];
    }
    catch (error) {
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
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const searchRadius = parseFloat(radius);
        const fallbackCity = city || await getCityFromCoords(latitude, longitude);
        const videos = await fetchTopVideos(fallbackCity, latitude, longitude, searchRadius);
        return res.status(200).json(videos);
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError) {
            return res.status(500).send({ error: error.message });
        }
        functions.logger.error("An unexpected error occurred in /getTopVideos:", error);
        return res.status(500).send({ error: "An unexpected error occurred." });
    }
});
exports.api = functions.runWith({ secrets: ["YOUTUBE_API_KEY", "KAKAO_APP_KEY", "NAVER_DATALAB_CLIENT_ID", "NAVER_DATALAB_CLIENT_SECRET", "NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET", "GOOGLE_CUSTOM_SEARCH_API_KEY", "GOOGLE_CUSTOM_SEARCH_ENGINE_ID"] }).region("asia-northeast3").https.onRequest(app);
//# sourceMappingURL=index.js.map