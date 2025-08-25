
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

const KeywordTrendsInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for.'),
  timeRange: z.enum(['5d', '1w', '1m']).default('1w').describe('The time range for the trend data.'),
});
export type KeywordTrendsInput = z.infer<typeof KeywordTrendsInputSchema>;

const KeywordTrendPointSchema = z.object({
    date: z.string().describe('The date for the data point (YYYY-MM-DD).'),
    value: z.number().describe('The search trend value.'),
});
export type KeywordTrendPoint = z.infer<typeof KeywordTrendPointSchema>;

const KeywordTrendsDataSchema = z.array(KeywordTrendPointSchema);
export type KeywordTrendsData = z.infer<typeof KeywordTrendsDataSchema>;

function generateMockTrendData(timeRange: '5d' | '1w' | '1m'): KeywordTrendsData {
    const now = new Date();
    let daysToGenerate;
    switch (timeRange) {
        case '5d':
            daysToGenerate = 5;
            break;
        case '1w':
            daysToGenerate = 7;
            break;
        case '1m':
            daysToGenerate = 30;
            break;
    }

    return Array.from({ length: daysToGenerate }).map((_, i) => {
        const date = subDays(now, daysToGenerate - 1 - i);
        return {
            date: format(date, 'yyyy-MM-dd'),
            value: Math.floor(Math.random() * 100),
        };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}


const getKeywordTrendsFlow = ai.defineFlow(
  {
    name: 'getKeywordTrendsFlow',
    inputSchema: KeywordTrendsInputSchema,
    outputSchema: KeywordTrendsDataSchema,
  },
  async (input) => {
    // In a real application, you would call the Google Trends API here.
    // For now, we'll return mock data.
    console.log(`Fetching trends for "${input.keyword}" over "${input.timeRange}"`);
    return generateMockTrendData(input.timeRange);
  }
);


export async function getKeywordTrends(input: KeywordTrendsInput): Promise<KeywordTrendsData> {
    return getKeywordTrendsFlow(input);
}
