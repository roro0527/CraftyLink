
'use server';
/**
 * @fileOverview A keyword regional rank analysis agent.
 *
 * - getKeywordRegionRank - A function that fetches and ranks regional interest for a keyword.
 * - KeywordRegionRankInput - The input type for the getKeywordRegionRank function.
 * - KeywordRegionRankOutput - The return type for the getKeywordRegionRank function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import googleTrends from 'google-trends-api';

const KeywordRegionRankInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for.'),
});
export type KeywordRegionRankInput = z.infer<typeof KeywordRegionRankInputSchema>;

const KeywordRegionRankOutputSchema = z.object({
    geoCode: z.string().optional().describe('The ISO 3166-2 code for the top region (e.g., KR-11).'),
    geoName: z.string().optional().describe('The name of the top region (e.g., Seoul).'),
    value: z.number().optional().describe('The trend score of the top region.'),
});
export type KeywordRegionRankOutput = z.infer<typeof KeywordRegionRankOutputSchema>;


const getKeywordRegionRankFlow = ai.defineFlow(
  {
    name: 'getKeywordRegionRankFlow',
    inputSchema: KeywordRegionRankInputSchema,
    outputSchema: KeywordRegionRankOutputSchema,
  },
  async (input) => {
    try {
      const results = await googleTrends.interestByRegion({
        keyword: input.keyword,
        geo: 'KR', // South Korea
        resolution: 'REGION',
      });
      const trendData = JSON.parse(results).default.geoMapData;

      if (!trendData || trendData.length === 0) {
        return {};
      }

      // Find the region with the highest value
      const topRegion = trendData.reduce((max: any, current: any) => {
        // The value is an array, we take the first element.
        const currentValue = Array.isArray(current.value) ? current.value[0] : 0;
        const maxValue = Array.isArray(max.value) ? max.value[0] : 0;
        return currentValue > maxValue ? current : max;
      }, trendData[0]);

      return {
        geoCode: topRegion.geoCode,
        geoName: topRegion.geoName,
        value: Array.isArray(topRegion.value) ? topRegion.value[0] : 0,
      };

    } catch (err) {
      console.error('Error fetching Google Trends data for regional rank:', err);
      // Return an empty object on error
      return {};
    }
  }
);

export async function getKeywordRegionRank(input: KeywordRegionRankInput): Promise<KeywordRegionRankOutput> {
  return getKeywordRegionRankFlow(input);
}
