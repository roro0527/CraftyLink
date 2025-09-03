
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
import googleTrends from 'google-trends-api';
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
      // 1. Fetch related keywords for the region
      const trendsResult = await googleTrends.relatedQueries({
        keyword,
        geo: region,
      });

      const parsedResults = JSON.parse(trendsResult);
      const rankedLists = parsedResults.default.rankedList;
      let relatedKeywords: string[] = [];

      if (Array.isArray(rankedLists) && rankedLists.length > 0) {
        // Find the "top" or "rising" list and extract queries
        for (const list of rankedLists) {
          if (list && Array.isArray(list.rankedKeyword) && list.rankedKeyword.length > 0) {
            relatedKeywords = list.rankedKeyword.slice(0, 5).map((item: any) => item.query);
            break; // Use the first available list
          }
        }
      }

      // 2. Fetch related YouTube videos (region is not directly supported, so we use the keyword)
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
