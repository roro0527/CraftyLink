import axios from "axios";
import * as functions from "firebase-functions";
import type { Firestore, Timestamp } from 'firebase-admin/firestore';

const CACHE_TTL_MINUTES = 10;

const removeHtmlTags = (str: string) => str ? str.replace(/<[^>]*>?/gm, '') : '';

export interface NewsArticle {
    title: string;
    url: string;
    summary: string;
}

/**
 * Fetches top news articles from Naver Search API.
 * This is a shared logic function that can be used by both Cloud Functions and other server-side code.
 * @param {string} query - The search query.
 * @param {Firestore} firestore - An instance of Firestore.
 * @param {string} naverClientId - The Naver API Client ID.
 * @param {string} naverClientSecret - The Naver API Client Secret.
 * @returns {Promise<NewsArticle[]>} A list of news articles.
 */
export async function fetchNaverNewsLogic(
    query: string,
    firestore: Firestore,
    naverClientId: string,
    naverClientSecret: string
): Promise<NewsArticle[]> {
    if (!query) {
        throw new Error("Missing required parameter: query");
    }
     if (!naverClientId || !naverClientSecret) {
        throw new Error("Naver API credentials are not provided.");
    }

    const cacheKey = query.replace(/[^a-zA-Z0-9가-힣]/g, ""); // Sanitize key
    const cacheRef = firestore.collection("naverNews").doc(cacheKey);
    const now = new Date().getTime();


    try {
        const cacheDoc = await cacheRef.get();
        if (cacheDoc.exists) {
            const cacheData = cacheDoc.data()!;
            // Firestore Timestamps need to be handled correctly
            const updatedAt = (cacheData.updatedAt as Timestamp).toMillis();
            const diffMinutes = (now - updatedAt) / (1000 * 60);

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
                "X-Naver-Client-Id": naverClientId,
                "X-Naver-Client-Secret": naverClientSecret,
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

            // Use serverTimestamp() if running in a Firebase environment, otherwise use a regular Date.
            // For simplicity, we'll just create a new Timestamp.
            const { Timestamp } = await import('firebase-admin/firestore');
            await cacheRef.set({
                articles,
                updatedAt: Timestamp.fromMillis(now),
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
