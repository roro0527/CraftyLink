
'use server';
/**
 * @fileOverview A keyword trend analysis AI agent using Naver DataLab API.
 *
 * - getKeywordTrends - A function that handles the keyword trend data fetching process.
 * - KeywordTrendsInput - The input type for the getKeywordtrends function.
 * - KeywordTrendsData - The return type for the getKeywordTrends function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { subDays, format, parse } from 'date-fns';
import axios from 'axios';


const KeywordTrendsInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for.'),
  timeRange: z.enum(['5d', '1w', '2w', '1m']).default('1w').describe('The time range for the trend data.'),
});
export type KeywordTrendsInput = z.infer<typeof KeywordTrendsInputSchema>;

const KeywordTrendPointSchema = z.object({
  date: z.string().describe('The date for the data point (YYYY-MM-DD).'),
  value: z.number().describe('The search trend value.'),
});

const KeywordTrendsDataSchema = z.array(KeywordTrendPointSchema);
export type KeywordTrendsData = z.infer<typeof KeywordTrendsDataSchema>;


const getKeywordTrendsFlow = ai.defineFlow(
  {
    name: 'getKeywordTrendsFlow',
    inputSchema: KeywordTrendsInputSchema,
    outputSchema: KeywordTrendsDataSchema,
  },
  async (input) => {
    const now = new Date();
    let daysToSubtract;
    switch (input.timeRange) {
      case '5d':
        daysToSubtract = 5;
        break;
      case '1w':
        daysToSubtract = 7;
        break;
      case '2w':
        daysToSubtract = 14;
        break;
      case '1m':
        daysToSubtract = 30;
        break;
    }
    const startDate = subDays(now, daysToSubtract);
    const endDate = now;

    const requestBody = {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      timeUnit: 'date',
      keywordGroups: [
        {
          groupName: input.keyword,
          keywords: [input.keyword],
        },
      ],
    };

    try {
      const response = await axios.post('https://openapi.naver.com/v1/datalab/search', requestBody, {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_DATALAB_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_DATALAB_CLIENT_SECRET,
          'Content-Type': 'application/json',
        },
      });

      const trendData = response.data.results[0]?.data;
      if (!trendData) {
        return [];
      }

      // Naver API returns a value of 100 for the period with the highest search volume.
      // Other periods are relative to this peak.
      return trendData.map((item: { period: string; ratio: number }) => ({
        date: item.period,
        value: item.ratio,
      }));

    } catch (err: any) {
      console.error('Error fetching Naver DataLab data:', err.response?.data || err.message);
      // Return an empty array on error to prevent app crashes
      return [];
    }
  }
);


export async function getKeywordTrends(input: KeywordTrendsInput): Promise<KeywordTrendsData> {
  return getKeywordTrendsFlow(input);
}
