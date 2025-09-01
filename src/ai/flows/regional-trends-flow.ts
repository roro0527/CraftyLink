
'use server';
/**
 * @fileOverview A regional trend analysis AI agent.
 *
 * - getRegionalTrends - A function that handles fetching trending keywords for a specific region.
 * - RegionalTrendsInput - The input type for the getRegionalTrends function.
 * - RegionalTrendsData - The return type for the getRegionalTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import googleTrends from 'google-trends-api';

const RegionalTrendsInputSchema = z.object({
  geoCode: z.string().describe('The ISO 3166-2 code for the region (e.g., KR-11 for Seoul).'),
});
export type RegionalTrendsInput = z.infer<typeof RegionalTrendsInputSchema>;

const RegionalTrendsDataSchema = z.array(z.string()).describe('A list of trending keywords for the region.');
export type RegionalTrendsData = z.infer<typeof RegionalTrendsDataSchema>;

const getRegionalTrendsFlow = ai.defineFlow(
  {
    name: 'getRegionalTrendsFlow',
    inputSchema: RegionalTrendsInputSchema,
    outputSchema: RegionalTrendsDataSchema,
  },
  async (input) => {
    try {
      // Using daily trends for a specific region.
      const results = await googleTrends.dailyTrends({
        geo: input.geoCode,
      });

      const parsedResults = JSON.parse(results);
      // The structure for daily trends is complex, we need to navigate it carefully.
      const trendingSearches = parsedResults.default.trendingSearchesDays[0]?.trendingSearches;

      if (Array.isArray(trendingSearches) && trendingSearches.length > 0) {
        // Extract the query from each trend item.
        return trendingSearches.slice(0, 3).map((item: any) => item.title.query);
      }
      
      return [];

    } catch (err) {
      console.error('Error fetching regional trends from Google Trends:', err);
      // Try to find related topics as a fallback
      try {
          const relatedResults = await googleTrends.relatedTopics({
              keyword: '뉴스', // A generic keyword
              geo: input.geoCode,
          });
          const parsedRelated = JSON.parse(relatedResults);
          const topics = parsedRelated.default.rankedList[0]?.rankedKeyword;
          if (Array.isArray(topics) && topics.length > 0) {
              return topics.slice(0, 3).map((item: any) => item.topic.title);
          }
      } catch (fallbackErr) {
          console.error('Fallback to related topics also failed:', fallbackErr);
      }
      
      return [];
    }
  }
);

export async function getRegionalTrends(input: RegionalTrendsInput): Promise<RegionalTrendsData> {
  return getRegionalTrendsFlow(input);
}
