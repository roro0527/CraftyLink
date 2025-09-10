
'use server';
/**
 * @fileOverview A related news fetching agent using Naver Search API via a Cloud Function.
 *
 * - getNaverNews - A function that handles fetching related news articles from Naver.
 * - NaverNewsInput - The input type for the getNaverNews function.
 * - RelatedNewsData - The return type for the getNaverNews function.
 */

import { z } from 'zod';
import axios from 'axios';
import { headers } from 'next/headers';

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


export async function getNaverNews(input: NaverNewsInput): Promise<RelatedNewsData> {
  const functionUrl = '/api/getNaverNews';
  
  try {
    const host = headers().get('host');
    const protocol = host?.startsWith('localhost') ? 'http' : 'https';
    const baseURL = `${protocol}://${host}`;

    const response = await axios.get(functionUrl, {
      baseURL,
      params: {
        query: input.keyword,
      },
    });

    // Validate the response data with Zod
    const validationResult = RelatedNewsDataSchema.safeParse(response.data);
    if (!validationResult.success) {
      console.error('Naver news data validation failed:', validationResult.error);
      return [];
    }

    return validationResult.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
        console.error('Error fetching Naver news from Cloud Function:', error.response?.data || error.message);
    } else {
        console.error('An unexpected error occurred in getNaverNews:', error);
    }
    return [];
  }
}
