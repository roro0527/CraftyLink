
'use server';
/**
 * @fileOverview A Pexels photo search agent.
 *
 * - getPexelsPhotos - A function that fetches photos from Pexels API.
 * - PexelsPhotosInput - The input type for the getPexelsPhotos function.
 * - PexelsPhotosOutput - The return type for the getPexelsPhotos function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import axios from 'axios';
import type { SearchResult } from '@/lib/types';

const PexelsPhotosInputSchema = z.object({
  query: z.string().describe('The search query for photos.'),
  page: z.number().optional().describe('The page number to fetch.'),
});
export type PexelsPhotosInput = z.infer<typeof PexelsPhotosInputSchema>;

const PexelsPhotosOutputSchema = z.object({
  photos: z.array(z.custom<SearchResult>()),
  hasMore: z.boolean(),
});
export type PexelsPhotosOutput = z.infer<typeof PexelsPhotosOutputSchema>;

const pexelsPhotosFlow = ai.defineFlow(
  {
    name: 'pexelsPhotosFlow',
    inputSchema: PexelsPhotosInputSchema,
    outputSchema: PexelsPhotosOutputSchema,
  },
  async ({ query, page }) => {
    const apiKey = process.env.PEXELS_API_KEY;
    if (!apiKey) {
      console.error('Pexels API key is not configured.');
      throw new Error('Server configuration error for Pexels API.');
    }

    const url = 'https://api.pexels.com/v1/search';
    
    try {
        const response = await axios.get(url, {
            headers: {
                Authorization: apiKey,
            },
            params: {
                query: query,
                per_page: 12,
                page: page || 1,
            },
        });
        
        const photos: SearchResult[] = response.data.photos.map((photo: any) => ({
            id: photo.id.toString(),
            title: photo.alt || 'Pexels Photo',
            url: photo.url,
            imageUrl: photo.src.medium,
            description: `Photo by ${photo.photographer}`,
            photographer_url: photo.photographer_url,
            source: 'Pexels',
        }));

        const hasMore = response.data.next_page !== undefined;

        return { photos, hasMore };

    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            console.error("Pexels API call failed:", {
                status: error.response?.status,
                data: error.response?.data,
                query: query
            });
            throw new Error(`Failed to fetch photos from Pexels. Status: ${error.response?.status}`);
        } else {
             console.error("An unexpected error occurred while fetching from Pexels:", error);
             throw new Error("An unexpected error occurred while fetching from Pexels.");
        }
    }
  }
);

export async function getPexelsPhotos(input: PexelsPhotosInput): Promise<PexelsPhotosOutput> {
    return pexelsPhotosFlow(input);
}
