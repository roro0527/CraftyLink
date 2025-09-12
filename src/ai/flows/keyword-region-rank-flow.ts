
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

const KeywordRegionRankOutputSchema = z.object({
    geoCode: z.string().optional().describe('The code for the top age group (e.g., 20 for 20-29).'),
    geoName: z.string().optional().describe('The name of the top age group (e.g., 20대).'),
    value: z.number().optional().describe('The click trend score of the top group.'),
});
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
        category: '50000000', // 패션의류
        keyword: input.keyword,
        device: '',
        gender: '',
        ages: [],
    };

    try {
        const response = await axios.post('https://openapi.naver.com/v1/datalab/shopping-insight/category/keyword/age', requestBody, {
            headers: {
              'X-Naver-Client-Id': process.env.NAVER_DATALAB_CLIENT_ID,
              'X-Naver-Client-Secret': process.env.NAVER_DATALAB_CLIENT_SECRET,
              'Content-Type': 'application/json',
            },
        });

        const trendData = response.data.results[0]?.data;

        if (!trendData || trendData.length === 0) {
            return {};
        }
        
        // Find the age group with the highest click ratio
        const topGroup = trendData.reduce((max: any, current: any) => {
            return current.ratio > max.ratio ? current : max;
        }, trendData[0]);

        return {
            geoCode: topGroup.group, // e.g. "20"
            geoName: `${topGroup.group}대`, // e.g. "20대"
            value: topGroup.ratio,
        };

    } catch (err: any) {
        console.error('Error fetching Naver DataLab shopping insight data for age:', err.response?.data || err.message);
        return {};
    }
  }
);

export async function getKeywordRegionRank(input: KeywordRegionRankInput): Promise<KeywordRegionRankOutput> {
  return getKeywordRegionRankFlow(input);
}
