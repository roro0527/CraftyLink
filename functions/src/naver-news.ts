
import axios from "axios";
import * as functions from "firebase-functions";
import type { Firestore, Timestamp } from 'firebase-admin/firestore';

const CACHE_TTL_MINUTES = 10;
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

const removeHtmlTags = (str: string) => str ? str.replace(/<[^>]*>?/gm, '') : '';

export interface NewsArticle {
    title: string;
    url: string;
    summary: string;
}

/**
 * Fetches top news articles from Naver Search API for Cloud Functions.
 * @param {string} query - The search query.
 * @param {Firestore} firestore - An instance of Firestore.
 * @returns {Promise<NewsArticle[]>} A list of news articles.
 */
export async function fetchNaverNewsLogic(
    query: string,
    firestore: Firestore
): Promise<NewsArticle[]> {
    if (!query) {
        throw new Error("Missing required parameter: query");
    }
     if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        functions.logger.error("Naver API credentials are not provided.");
        throw new Error("Naver API credentials are not provided.");
    }

    const cacheKey = query.replace(/[^a-zA-Z0-9가-힣]/g, ""); // Sanitize key
    const cacheRef = firestore.collection("naverNews").doc(cacheKey);

    try {
        const cacheDoc = await cacheRef.get();
        if (cacheDoc.exists) {
            const cacheData = cacheDoc.data()!;
            const updatedAt = (cacheData.updatedAt as Timestamp).toMillis();
            const diffMinutes = (Date.now() - updatedAt) / (1000 * 60);
            
            if (diffMinutes < CACHE_TTL_MINUTES) {
                functions.logger.info(`Returning cached news for query: ${query}`);
                return cacheData.articles as NewsArticle[];
            }
        }

        functions.logger.info(`Cache miss or expired for news query: ${query}. Fetching fresh data.`);
        const url = "https://openapi.naver.com/v1/search/news.json";

        const response = await axios.get(url, {
            params: { query: query, display: 5, sort: 'sim' },
            headers: {
                "X-Naver-Client-Id": NAVER_CLIENT_ID,
                "X-Naver-Client-Secret": NAVER_CLIENT_SECRET,
            },
        });
        
        if (response.data && response.data.errorMessage) {
            functions.logger.error("Naver API returned an error:", response.data.errorMessage, { query });
            throw new Error(`Naver API Error: ${response.data.errorMessage}`);
        }

        if (response.data && response.data.items) {
            const articles: NewsArticle[] = response.data.items.map((item: any) => ({
                title: removeHtmlTags(item.title),
                url: item.originallink,
                summary: removeHtmlTags(item.description),
            }));

            await cacheRef.set({
                articles,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            functions.logger.info(`Successfully cached news for query: ${query}`);

            return articles;
        } else {
            functions.logger.warn("Naver API call successful but no items were returned.", { query, responseData: response.data });
            return [];
        }

    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            functions.logger.error(`Naver API call failed for query "${query}":`, {
                status: error.response.status,
                data: error.response.data,
            });
            // Re-throw a more specific error to be handled by the caller
            throw new Error(`Failed to fetch news from Naver API. Status: ${error.response.status}`);
        } else {
            functions.logger.error(`An unexpected error occurred in fetchNaverNewsLogic for query "${query}":`, error);
            throw new Error("An unexpected error occurred while fetching news.");
        }
    }
}
