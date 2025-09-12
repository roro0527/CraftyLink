
'use server';
/**
 * @fileOverview Fetches regional trend data.
 *
 * - getRegionalTrends - Fetches related keywords and videos for a given keyword and region.
 * - RegionalTrendsInput - The input type for the getRegionalTrends function.
 * - RegionalTrendsOutput - The return type for the getRegionalTrends function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getYoutubeVideos, type YoutubeVideosData, type YoutubeVideosInput } from './youtube-videos-flow';

const RegionalTrendsInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for.'),
  region: z.string().describe('The region code (e.g., KR-11 for Seoul).'),
});
export type RegionalTrendsInput = z.infer<typeof RegionalTrendsInputSchema>;

const RegionalTrendsOutputSchema = z.object({
  relatedKeywords: z.array(z.string()).describe('A list of related keywords for the region.'),
  relatedVideos: z.custom<YoutubeVideosData>().describe('A list of related YouTube videos.')
});
export type RegionalTrendsOutput = z.infer<typeof RegionalTrendsOutputSchema>;


const getRegionalTrendsFlow = ai.defineFlow(
  {
    name: 'getRegionalTrendsFlow',
    inputSchema: RegionalTrendsInputSchema,
    outputSchema: RegionalTrendsOutputSchema,
  },
  async (input) => {
    
    const { keyword, region } = input;
    
    try {
      // google-trends-api was removed. We will return empty data for now.
      const relatedKeywords: string[] = [];

      // Fetch related YouTube videos (region is not directly supported, so we use the keyword)
      const relatedVideos = await getYoutubeVideos({ keyword });

      return {
        relatedKeywords,
        relatedVideos,
      };

    } catch (error) {
      console.error(`Error fetching regional trends for ${keyword} in ${region}:`, error);
      // Return empty data in case of an error to avoid crashing the app
      return {
        relatedKeywords: [],
        relatedVideos: [],
      };
    }
  }
);


export async function getRegionalTrends(input: RegionalTrendsInput): Promise<RegionalTrendsOutput> {
  return getRegionalTrendsFlow(input);
}
