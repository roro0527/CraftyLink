
'use server';
/**
 * @fileOverview Genkit flow to fetch images from Google Custom Search API.
 *
 * - getGoogleImagesFlow: Public function to fetch image search results.
 * - GoogleImagesInput: Input type for the getGoogleImagesFlow function.
 * - GoogleImagesData: Return type for the getGoogleImagesFlow function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import axios from 'axios';
import type { SearchResult } from '@/lib/types';


// Input Schema: Defines 'query' and 'start' index as fields.
const GoogleImagesInputSchema = z.object({
  query: z.string().describe('The keyword to search for.'),
  start: z.number().optional().default(1).describe('The starting index for the search results.'),
});
export type GoogleImagesInput = z.infer<typeof GoogleImagesInputSchema>;


// Output Schema: Defines the structure for the returned image data.
const GoogleImagesDataSchema = z.object({
    photos: z.array(z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
        imageUrl: z.string(),
        description: z.string().optional(),
        source: z.string().optional(),
    })).describe("A list of image search results."),
    nextPage: z.number().optional().nullable().describe("The start index for the next page of results."),
});
export type GoogleImagesData = z.infer<typeof GoogleImagesDataSchema>;


/**
 * Core Genkit flow to call the Google Custom Search API.
 */
export const getGoogleImagesFlow = ai.defineFlow(
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
      throw new Error("Server configuration error: Missing API credentials.");
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
        const searchResult: SearchResult[] = items.map((item: any) => ({
            id: item.cacheId || `${item.link}-${Math.random()}`,
            title: item.title,
            url: item.image.contextLink,
            imageUrl: item.link,
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
            throw new Error(`Failed to fetch images from Google: ${error.response?.data?.error?.message || error.message}`);
        }
        console.error("An unexpected error occurred while fetching Google Images:", error);
        throw new Error("An unexpected error occurred while fetching images.");
    }
  }
);
