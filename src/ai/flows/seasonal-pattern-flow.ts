
'use server';
/**
 * @fileOverview A keyword seasonal pattern analysis agent using Naver DataLab API.
 *
 * - getSeasonalPattern - A function that fetches seasonal trend data for a keyword.
 */

import { ai } from '@/ai/genkit';
import axios from 'axios';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { SeasonalPatternDataSchema, SeasonalPatternInputSchema } from '@/lib/types';
import type { SeasonalPatternData, SeasonalPatternInput } from '@/lib/types';


const CACHE_TTL_HOURS = 24;

const seasonalPatternFlow = ai.defineFlow(
  {
    name: 'seasonalPatternFlow',
    inputSchema: SeasonalPatternInputSchema,
    outputSchema: SeasonalPatternDataSchema,
  },
  async (input): Promise<SeasonalPatternData> => {
    const { keyword, startDate, endDate, timeUnit } = input;
    const firestore = getAdminFirestore();
    const cacheKey = `seasonal-${keyword}-${startDate}-${endDate}-${timeUnit}`.replace(/[^a-zA-Z0-9-]/g, "");
    const cacheRef = firestore.collection('naverDatalabCache').doc(cacheKey);
    
    // 1. Check cache
     try {
        const cacheDoc = await cacheRef.get();
        if (cacheDoc.exists) {
            const cacheData = cacheDoc.data()!;
            const now = new Date().getTime();
            const updatedAt = cacheData.updatedAt.toMillis();
            const diffHours = (now - updatedAt) / (1000 * 60 * 60);

            if (diffHours < CACHE_TTL_HOURS) {
                console.log(`Returning cached seasonal data for: ${keyword}`);
                return cacheData.data as SeasonalPatternData;
            }
        }
    } catch (e) {
        console.error("Cache read error for seasonal, proceeding to fetch from API:", e);
    }
    

    // 2. Fetch from API
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

       // 3. Update cache
        await cacheRef.set({
            data,
            updatedAt: new Date(),
        });

      return data;

    } catch (err: any) {
      console.error('Error fetching Naver DataLab seasonal data:', err.response?.data || err.message);
      return []; // Return empty array on error
    }
  }
);

export async function getSeasonalPattern(input: SeasonalPatternInput): Promise<SeasonalPatternData> {
  return seasonalPatternFlow(input);
}
