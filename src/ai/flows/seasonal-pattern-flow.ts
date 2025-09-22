
'use server';
/**
 * @fileOverview A keyword seasonal pattern analysis agent using Naver DataLab API.
 *
 * - getSeasonalPattern - A function that fetches seasonal trend data for a keyword.
 */

import { ai } from '@/ai/genkit';
import axios from 'axios';
import { SeasonalPatternDataSchema, SeasonalPatternInputSchema } from '@/lib/types';
import type { SeasonalPatternData, SeasonalPatternInput } from '@/lib/types';

export const getSeasonalPattern = ai.defineFlow(
  {
    name: 'seasonalPatternFlow',
    inputSchema: SeasonalPatternInputSchema,
    outputSchema: SeasonalPatternDataSchema,
  },
  async (input): Promise<SeasonalPatternData> => {
    const { keyword, startDate, endDate, timeUnit } = input;
    
    console.log(`Fetching fresh seasonal data for: ${keyword}`);
    const requestBody = {
      startDate,
      endDate,
      timeUnit: timeUnit || 'month',
      category: '50000001', // Using a broad category '디지털/가전'
      keyword,
      device: '',
      gender: '',
      ages: [],
    };

    try {
      const response = await axios.post('https://openapi.naver.com/v1/datalab/shopping-insight/category/keyword/seasonal', requestBody, {
        headers: {
          'X-Naver-Client-Id': process.env.NAVER_DATALAB_CLIENT_ID!,
          'X-Naver-Client-Secret': process.env.NAVER_DATALAB_CLIENT_SECRET!,
          'Content-Type': 'application/json',
        },
      });

      const trendData = response.data.results[0]?.data;
      if (!trendData) {
        console.log("No seasonal results from Naver API for keyword:", keyword);
        return [];
      }

      const data: SeasonalPatternData = trendData.map((item: { period: string; value: number }) => ({
        date: item.period,
        value: item.value,
      }));

      // Validate the transformed data
      const validationResult = SeasonalPatternDataSchema.safeParse(data);
      if (!validationResult.success) {
        console.error("Data validation failed for seasonal pattern:", validationResult.error);
        return [];
      }

      return validationResult.data;

    } catch (err: any) {
      console.error('Error fetching Naver DataLab seasonal data:', err.response?.data || err.message);
      return []; // Return empty array on error
    }
  }
);
