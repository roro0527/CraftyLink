
'use server';
/**
 * @fileOverview A related news fetching agent using a shared business logic function.
 *
 * - getNaverNews - A function that handles fetching related news articles from Naver.
 * - NaverNewsInput - The input type for the getNaverNews function.
 * - RelatedNewsData - The return type for the getNaverNews function.
 */

import { z } from 'zod';
import axios from 'axios';
import { ai } from '@/ai/genkit';

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

const removeHtmlTags = (str: string) => str ? str.replace(/<[^>]*>?/gm, '') : '';

export const getNaverNewsFlow = ai.defineFlow({
    name: 'getNaverNewsFlow',
    inputSchema: NaverNewsInputSchema,
    outputSchema: RelatedNewsDataSchema
}, async (input) => {
    try {
        console.log(`Fetching Naver news for keyword: ${input.keyword} (caching disabled)`);
        const { keyword } = input;
        const naverClientId = process.env.NAVER_CLIENT_ID;
        const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

        if (!keyword) {
            throw new Error("Missing required parameter: keyword");
        }
        if (!naverClientId || !naverClientSecret) {
            console.error("Naver API credentials are not provided in environment variables.");
            throw new Error("Naver API credentials are not provided.");
        }

        const url = "https://openapi.naver.com/v1/search/news.json";

        const response = await axios.get(url, {
            params: { query: keyword, display: 5, sort: 'sim' },
            headers: {
                "X-Naver-Client-Id": naverClientId,
                "X-Naver-Client-Secret": naverClientSecret,
            },
        });

        if (response.data && response.data.errorMessage) {
            console.error("Naver API returned an error:", response.data.errorMessage, { keyword });
            throw new Error(`Naver API Error: ${response.data.errorMessage}`);
        }

        let articles: RelatedNewsData = [];
        if (response.data && response.data.items) {
            articles = response.data.items.map((item: any) => ({
                title: removeHtmlTags(item.title),
                url: item.originallink,
                summary: removeHtmlTags(item.description),
            }));
        }

        const validationResult = RelatedNewsDataSchema.safeParse(articles);

        if (!validationResult.success) {
        console.error('Naver news data validation failed:', validationResult.error);
        throw new Error('Naver news data validation failed.');
        }

        return validationResult.data;

    } catch (error: any) {
        console.error(`An unexpected error occurred in getNaverNews for keyword '${input.keyword}':`, error);
        if (axios.isAxiosError(error) && error.response) {
            console.error(`Naver API call failed:`, {
                status: error.response.status,
                data: error.response.data,
            });
        }
        throw new Error(`Failed to get news for ${input.keyword}.`);
    }
});


export async function getNaverNews(input: NaverNewsInput): Promise<RelatedNewsData> {
  return await getNaverNewsFlow(input);
}
