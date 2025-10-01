
/**
 * @fileOverview Firebase Cloud Functions for CraftyLink.
 *
 * This file defines independent HTTP endpoints using Firebase Functions v2.
 * - api/getGoogleImages: Fetches images from Google Custom Search API.
 * - api/getTopVideos: Fetches top YouTube videos for a given location.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import { google } from "googleapis";
import { onRequest } from "firebase-functions/v2/https";
import cors from "cors";

// Initialize Firebase Admin SDK
try {
    admin.initializeApp();
} catch (e) {
  console.error('Firebase admin initialization error', e);
}

const corsMiddleware = cors({ origin: true });

// --- Google Images Function ---
export const getGoogleImages = onRequest(
    {
        region: "asia-northeast3",
        secrets: ["GOOGLE_CUSTOM_SEARCH_API_KEY", "GOOGLE_CUSTOM_SEARCH_ENGINE_ID"],
    },
    (req, res) => {
        corsMiddleware(req, res, async () => {
            const { query, start } = req.query;

            if (typeof query !== "string") {
                res.status(400).send({ error: "query parameter is missing or invalid." });
                return;
            }

            const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
            const cseId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

            if (!apiKey || !cseId) {
                functions.logger.error("Google Custom Search API Key or Engine ID is not configured.");
                res.status(500).send({ error: "Server configuration error." });
                return;
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
                    imageUrl: item.link,
                    description: item.snippet,
                    source: item.displayLink,
                }));
                
                const nextPageIndex = response.data.queries?.nextPage?.[0]?.startIndex;

                res.status(200).json({ 
                    photos: searchResult,
                    nextPage: nextPageIndex,
                });

            } catch (error) {
                if (axios.isAxiosError(error)) {
                    functions.logger.error("Google Custom Search API call failed:", error.response?.data || error.message);
                    res.status(error.response?.status || 500).send({ error: "Failed to fetch images from Google.", details: error.response?.data });
                } else {
                    functions.logger.error("An unexpected error occurred while fetching Google Images:", error);
                    res.status(500).send({ error: "An unexpected error occurred." });
                }
            }
        });
    }
);


// --- YouTube and Kakao API Setup ---
const youtube = google.youtube({
  version: "v3",
});
async function getCityFromCoords(lat: number, lng: number): Promise<string> {
  const KAKAO_API_KEY = process.env.KAKAO_APP_KEY;
  if (!KAKAO_API_KEY) {
    functions.logger.error("Kakao API Key is not configured.");
    throw new functions.https.HttpsError("internal", "Server configuration error for location services.");
  }
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

async function fetchTopVideos(city: string, lat: number, lng: number, radius: number): Promise<any[]> {
    const locationString = `${lat},${lng}`;
    const locationRadiusString = `${radius}km`;
    const MAX_RESULTS_PER_CALL = 25;
    
    let videoIds = new Set<string>();

    const youtubeClient = google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY,
    });

    try {
        const locationSearchResponse = await youtubeClient.search.list({
            part: ['id'],
            type: ['video'],
            location: locationString,
            locationRadius: locationRadiusString,
            maxResults: MAX_RESULTS_PER_CALL,
            order: 'viewCount',
        });
        locationSearchResponse.data.items?.forEach(item => item.id?.videoId && videoIds.add(item.id.videoId));
        
        if (videoIds.size < MAX_RESULTS_PER_CALL) {
            const citySearchResponse = await youtubeClient.search.list({
                part: ['id'],
                type: ['video'],
                q: `${city} 인기 영상`,
                maxResults: MAX_RESULTS_PER_CALL - videoIds.size,
                order: 'relevance',
            });
            citySearchResponse.data.items?.forEach(item => item.id?.videoId && videoIds.add(item.id.videoId));
        }

        if (videoIds.size === 0) return [];

        const videoDetailsResponse = await youtubeClient.videos.list({
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


// --- Top Videos Function ---
export const getTopVideos = onRequest(
    {
        region: "asia-northeast3",
        secrets: ["YOUTUBE_API_KEY", "KAKAO_APP_KEY"],
    },
    (req, res) => {
        corsMiddleware(req, res, async () => {
            const { lat, lng, radius, city } = req.query;

            if (!lat || !lng || !radius) {
                res.status(400).send({ error: "lat, lng, and radius parameters are required." });
                return;
            }

            try {
                const latitude = parseFloat(lat as string);
                const longitude = parseFloat(lng as string);
                const searchRadius = parseFloat(radius as string);
                const fallbackCity = city as string || await getCityFromCoords(latitude, longitude);

                const videos = await fetchTopVideos(fallbackCity, latitude, longitude, searchRadius);
                res.status(200).json(videos);
            } catch (error) {
                if (error instanceof functions.https.HttpsError) {
                    res.status(500).send({ error: error.message });
                } else {
                    functions.logger.error("An unexpected error occurred in /getTopVideos:", error);
                    res.status(500).send({ error: "An unexpected error occurred." });
                }
            }
        });
    }
);
