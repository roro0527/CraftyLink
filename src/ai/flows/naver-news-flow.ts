
'use server';
/**
 * @fileOverview A related news fetching agent using Naver Search API.
 *
 * - getNaverNews - A function that handles fetching related news articles from Naver.
 * - NaverNewsInput - The input type for the getNaverNews function.
 * - RelatedNewsData - The return type for the getNaverNews function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import axios from 'axios';

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

const getNaverNewsFlow = ai.defineFlow(
  {
    name: 'getNaverNewsFlow',
    inputSchema: NaverNewsInputSchema,
    outputSchema: RelatedNewsDataSchema,
  },
  async (input) => {
    // This URL should point to your Firebase Function endpoint.
    // Ensure the region and project ID are correct for your setup.
    const functionUrl = `https://asia-northeast3-crafylink.cloudfunctions.net/api/getNaverNews`;
    
    try {
      const response = await axios.get(functionUrl, {
        params: {
          query: input.keyword,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Naver news from Cloud Function:', error);
      return [];
    }
  }
);

export async function getNaverNews(input: NaverNewsInput): Promise<RelatedNewsData> {
  return getNaverNewsFlow(input);
}
