
'use server';
/**
 * @fileOverview A related keywords agent using Naver DataLab API.
 *
 * - getRelatedKeywords - A function that handles fetching related keywords.
 * - RelatedKeywordsInput - The input type for the getRelatedKeywords function.
 * - RelatedKeywordsData - The return type for the getRelatedKeywords function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import axios from 'axios';
import { format, subMonths } from 'date-fns';

const RelatedKeywordsInputSchema = z.object({
  keyword: z.string().describe('The keyword to find related queries for.'),
});
export type RelatedKeywordsInput = z.infer<typeof RelatedKeywordsInputSchema>;

const RelatedKeywordsDataSchema = z.array(z.string()).describe('A list of related keywords.');
export type RelatedKeywordsData = z.infer<typeof RelatedKeywordsDataSchema>;

const getRelatedKeywordsFlow = ai.defineFlow(
  {
    name: 'getRelatedKeywordsFlow',
    inputSchema: RelatedKeywordsInputSchema,
    outputSchema: RelatedKeywordsDataSchema,
  },
  async (input) => {
    const endDate = new Date();
    const startDate = subMonths(endDate, 1);

    const requestBody = {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      timeUnit: 'month',
      category: '50000001', // 디지털/가전 - All categories are not supported, so pick a broad one.
      keyword: input.keyword,
      device: '',
      gender: '',
      ages: [],
    };

    try {
      const response = await axios.post('https://openapi.naver.com/v1/datalab/shopping-insight/category/keyword/rank', requestBody, {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_DATALAB_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_DATALAB_CLIENT_SECRET,
          'Content-Type': 'application/json',
        },
      });

      const rankedKeywords = response.data.results[0]?.data;
      if (!rankedKeywords || rankedKeywords.length === 0) {
        console.warn(`No related keywords found for: ${input.keyword}`);
        return [];
      }
      
      // Return top 5 related keywords
      return rankedKeywords.slice(0, 5).map((item: any) => item.keyword);

    } catch (err: any) {
      console.error('Error fetching related keywords from Naver DataLab:', err.response?.data || err.message);
      // Return an empty array on error to prevent app crashes
      return [];
    }
  }
);

export async function getRelatedKeywords(input: RelatedKeywordsInput): Promise<RelatedKeywordsData> {
  return getRelatedKeywordsFlow(input);
}
