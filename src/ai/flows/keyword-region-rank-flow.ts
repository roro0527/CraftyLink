
'use server';
/**
 * @fileOverview A keyword regional rank analysis agent using Naver DataLab API.
 *
 * - getKeywordRegionRank - A function that fetches and ranks regional interest for a keyword.
 * - KeywordRegionRankInput - The input type for the getKeywordRegionRank function.
 * - KeywordRegionRankOutput - The return type for the getKeywordRegionRank function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import axios from 'axios';
import { format, subMonths } from 'date-fns';

const KeywordRegionRankInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for.'),
});
export type KeywordRegionRankInput = z.infer<typeof KeywordRegionRankInputSchema>;

const RegionRankSchema = z.object({
    geoCode: z.string().optional().describe('The code for the region.'),
    geoName: z.string().optional().describe('The name of the region (e.g., "경기도").'),
    value: z.number().optional().describe('The click trend score of the region.'),
});

const KeywordRegionRankOutputSchema = z.array(RegionRankSchema);

export type KeywordRegionRankOutput = z.infer<typeof KeywordRegionRankOutputSchema>;

const getKeywordRegionRankFlow = ai.defineFlow(
  {
    name: 'getKeywordRegionRankFlow',
    inputSchema: KeywordRegionRankInputSchema,
    outputSchema: KeywordRegionRankOutputSchema,
  },
  async (input) => {
    const endDate = new Date();
    const startDate = subMonths(endDate, 1);
    
    const requestBody = {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        timeUnit: 'month',
        category: '50000001', // 디지털/가전
        keyword: input.keyword,
        device: '',
        gender: '',
        ages: [],
    };

    try {
        const response = await axios.post('https://openapi.naver.com/v1/datalab/shopping-insight/category/keyword/area', requestBody, {
            headers: {
              'X-Naver-Client-Id': process.env.NAVER_DATALAB_CLIENT_ID,
              'X-Naver-Client-Secret': process.env.NAVER_DATALAB_CLIENT_SECRET,
              'Content-Type': 'application/json',
            },
        });

        const trendData = response.data.results[0]?.data;

        if (!trendData || trendData.length === 0) {
            return [];
        }
        
        // Sort by ratio and take top 3
        const topRegions = trendData
          .sort((a: any, b: any) => b.ratio - a.ratio)
          .slice(0, 3)
          .map((item: any) => ({
            geoCode: item.group,
            geoName: item.group,
            value: item.ratio,
          }));

        return topRegions;

    } catch (err: any) {
        console.error('Error fetching Naver DataLab shopping insight data for region:', err.response?.data || err.message);
        return [];
    }
  }
);

export async function getKeywordRegionRank(input: KeywordRegionRankInput): Promise<KeywordRegionRankOutput> {
  return getKeywordRegionRankFlow(input);
}
