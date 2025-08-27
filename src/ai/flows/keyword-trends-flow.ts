
'use server';
/**
 * @fileOverview A keyword trend analysis AI agent.
 *
 * - getKeywordTrends - A function that handles the keyword trend data fetching process.
 * - KeywordTrendsInput - The input type for the getKeywordtrends function.
 * - KeywordTrendsData - The return type for the getKeywordTrends function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { subDays, format } from 'date-fns';
import googleTrends from 'google-trends-api';
import type { KeywordTrendPoint } from '@/lib/types';


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
    const startTime = subDays(now, daysToSubtract);

    try {
        const results = await googleTrends.interestOverTime({
            keyword: input.keyword,
            startTime: startTime,
        });
        const trendData = JSON.parse(results).default.timelineData;
        return trendData.map((item: any) => ({
            date: format(new Date(parseInt(item.time) * 1000), 'yyyy-MM-dd'),
            value: item.value[0],
        }));
    } catch (err) {
        console.error('Error fetching Google Trends data:', err);
        throw new Error('Failed to fetch Google Trends data.');
    }
  }
);


export async function getKeywordTrends(input: KeywordTrendsInput): Promise<KeywordTrendsData> {
    return getKeywordTrendsFlow(input);
}
