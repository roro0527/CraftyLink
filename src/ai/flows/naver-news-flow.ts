'use server';
/**
 * @fileOverview A related news fetching agent using a shared business logic function.
 *
 * - getNaverNews - A function that handles fetching related news articles from Naver.
 * - NaverNewsInput - The input type for the getNaverNews function.
 * - RelatedNewsData - The return type for the getNaverNews function.
 */

import { z } from 'zod';
import { fetchNaverNewsLogic, type NewsArticle } from '@/lib/naver-news';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

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
        // In a non-Functions environment, you need to provide credentials.
        // Assumes service account key is stored in an environment variable.
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
            initializeApp({
                credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
            });
        } else {
            // This will work in Cloud Functions and other GCP environments.
             initializeApp();
        }
    }
    return getFirestore();
}


export async function getNaverNews(input: NaverNewsInput): Promise<RelatedNewsData> {
  try {
    const firestore = getAdminFirestore();
    const articles: NewsArticle[] = await fetchNaverNewsLogic(
        input.keyword,
        firestore,
        process.env.NAVER_CLIENT_ID!,
        process.env.NAVER_CLIENT_SECRET!
    );

    // Validate the response data with Zod
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
