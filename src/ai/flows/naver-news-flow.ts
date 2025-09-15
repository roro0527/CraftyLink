'use server';
/**
 * @fileOverview A related news fetching agent using a shared business logic function.
 *
 * - getNaverNews - A function that handles fetching related news articles from Naver.
 * - NaverNewsInput - The input type for the getNaverNews function.
 * - RelatedNewsData - The return type for the getNaverNews function.
 */

import { z } from 'zod';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import axios from 'axios';

const logger = console;
const CACHE_TTL_MINUTES = 10;

const removeHtmlTags = (str: string) => str ? str.replace(/<[^>]*>?/gm, '') : '';


const NaverNewsInputSchema = z.object({
  keyword: z.string().describe('The keyword to find news articles for.'),
});
export type NaverNewsInput = z.infer<typeof NaverNewsInputSchema>;

const NewsArticleSchema = z.object({
  title: z.string().describe('The title of the news article.'),
  summary: z.string().describe('A brief summary of the news article.'),
  url: z.string().url().describe('The URL of the news article.'),
});

const RelatedNewsDataSchema = z.array(NewsArticleSchema).describe('A list of related news articles.');
export type RelatedNewsData = z.infer<typeof RelatedNewsDataSchema>;

function getAdminFirestore() {
    if (getApps().length === 0) {
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            initializeApp({
                credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
            });
        } else {
             initializeApp();
        }
    }
    return getFirestore();
}

async function fetchNaverNewsFromNext(
    query: string,
    firestore: ReturnType<typeof getAdminFirestore>,
    naverClientId: string,
    naverClientSecret: string
): Promise<RelatedNewsData> {
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
            const updatedAt = (cacheData.updatedAt as Timestamp).toMillis();
            const diffMinutes = (now - updatedAt) / (1000 * 60);

            if (diffMinutes < CACHE_TTL_MINUTES) {
                logger.info(`Returning cached news for query: ${query}`);
                return cacheData.articles as RelatedNewsData;
            }
        }

        logger.info(`Cache miss or expired for news query: ${query}. Fetching fresh data.`);
        const url = "https://openapi.naver.com/v1/search/news.json";

        const response = await axios.get(url, {
            params: { query: query, display: 5, sort: 'sim' },
            headers: {
                "X-Naver-Client-Id": naverClientId,
                "X-Naver-Client-Secret": naverClientSecret,
            },
        });

        if (response.data && response.data.errorMessage) {
            logger.error("Naver API returned an error:", response.data.errorMessage, { query });
            throw new Error(`Naver API Error: ${response.data.errorMessage}`);
        }

        if (response.data && response.data.items) {
            const articles: RelatedNewsData = response.data.items.map((item: any) => ({
                title: removeHtmlTags(item.title),
                url: item.originallink,
                summary: removeHtmlTags(item.description),
            }));

            await cacheRef.set({
                articles,
                updatedAt: Timestamp.fromMillis(now),
            });
            logger.info(`Successfully cached news for query: ${query}`);

            return articles;
        } else {
            logger.warn("Naver API call successful but no items were returned.", { query, responseData: response.data });
            return [];
        }

    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            logger.error(`Naver API call failed for query "${query}":`, {
                status: error.response.status,
                data: error.response.data,
            });
            throw new Error(`Failed to fetch news from Naver API. Status: ${error.response.status}`);
        } else {
            logger.error(`An unexpected error occurred in fetchNaverNewsFromNext for query "${query}":`, error);
            throw new Error("An unexpected error occurred while fetching news.");
        }
    }
}


export async function getNaverNews(input: NaverNewsInput): Promise<RelatedNewsData> {
  try {
    const firestore = getAdminFirestore();
    const articles = await fetchNaverNewsFromNext(
        input.keyword,
        firestore,
        process.env.NAVER_CLIENT_ID!,
        process.env.NAVER_CLIENT_SECRET!
    );

    const validationResult = RelatedNewsDataSchema.safeParse(articles);

    if (!validationResult.success) {
      console.error('Naver news data validation failed:', validationResult.error);
      return [];
    }

    return validationResult.data;
  } catch (error: any) {
    console.error('An unexpected error occurred in getNaverNews:', error);
    throw error;
  }
}
