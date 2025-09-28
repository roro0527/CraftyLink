
'use server';
/**
 * @fileOverview A Google Images search agent using Google Custom Search API.
 *
 * - getGoogleImages - A function that fetches images from Google Custom Search.
 * - GoogleImagesInput - The input type for the getGoogleImages function.
 * - GoogleImagesData - The return type for the getGoogleImages function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import axios from 'axios';
import type { SearchResult } from '@/lib/types';


const GoogleImagesInputSchema = z.object({
  query: z.string().describe('The search query.'),
  start: z.number().optional().default(1).describe('The starting index for results.'),
});
export type GoogleImagesInput = z.infer<typeof GoogleImagesInputSchema>;


const GoogleImagesDataSchema = z.object({
    photos: z.array(z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
        imageUrl: z.string(),
        description: z.string(),
        source: z.string(),
    })),
    nextPage: z.number().optional().nullable(),
});
export type GoogleImagesData = z.infer<typeof GoogleImagesDataSchema>;


const getGoogleImagesFlow = ai.defineFlow(
  {
    name: 'getGoogleImagesFlow',
    inputSchema: GoogleImagesInputSchema,
    outputSchema: GoogleImagesDataSchema,
  },
  async (input) => {
    const { query, start } = input;

    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const cseId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

    if (!apiKey || !cseId) {
      console.error("Google Custom Search API Key or Engine ID is not configured in environment variables.");
      throw new Error("Server configuration error for Google Images search.");
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
          start: start,
        },
      });

      const items = response.data.items || [];
      const searchResult: SearchResult[] = items.map((item: any) => ({
        id: item.cacheId || `${item.link}-${Math.random()}`,
        title: item.title,
        url: item.image.contextLink,
        imageUrl: item.link, // Direct image link
        description: item.snippet,
        source: item.displayLink,
      }));
      
      const nextPageIndex = response.data.queries?.nextPage?.[0]?.startIndex;

      return { 
          photos: searchResult,
          nextPage: nextPageIndex,
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Google Custom Search API call failed:", error.response?.data || error.message);
        throw new Error(`Failed to fetch images from Google. Details: ${error.response?.data?.error?.message || error.message}`);
      }
      console.error("An unexpected error occurred while fetching Google Images:", error);
      throw new Error("An unexpected error occurred while fetching images.");
    }
  }
);

export async function getGoogleImages(input: GoogleImagesInput): Promise<GoogleImagesData> {
  return getGoogleImagesFlow(input);
}

