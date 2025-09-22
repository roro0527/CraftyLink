
'use server';
/**
 * @fileOverview A keyword gender/age analysis agent using Naver DataLab API.
 *
 * - getGenderAgeTrend - A function that fetches gender and age trend data for a keyword.
 */

import { ai } from '@/ai/genkit';
import axios from 'axios';
import { GenderAgeTrendDataSchema, GenderAgeTrendInputSchema } from '@/lib/types';
import type { GenderAgeTrendData, GenderAgeTrendInput } from '@/lib/types';

export const getGenderAgeTrend = ai.defineFlow(
  {
    name: 'genderAgeTrendFlow',
    inputSchema: GenderAgeTrendInputSchema,
    outputSchema: GenderAgeTrendDataSchema,
  },
  async (input): Promise<GenderAgeTrendData> => {
    const { keyword, startDate, endDate } = input;
    
    console.log(`Fetching fresh gender/age data for: ${keyword}`);
    const requestBody = {
      startDate,
      endDate,
      timeUnit: 'date',
      category: '50000001', // Using a broad category like '디지털/가전'
      keyword,
      device: '',
      gender: '',
      ages: [],
    };

    try {
        const response = await axios.post('https://openapi.naver.com/v1/datalab/shopping-insight/category/keyword/gender-age', requestBody, {
            headers: {
              'X-Naver-Client-Id': process.env.NAVER_DATALAB_CLIENT_ID!,
              'X-Naver-Client-Secret': process.env.NAVER_DATALAB_CLIENT_SECRET!,
              'Content-Type': 'application/json',
            },
        });

        const results = response.data.results[0];
        if (!results || !results.data || results.data.length === 0) {
            console.log("No gender/age results from Naver API for keyword:", keyword);
            return { genderGroups: [], ageGroups: [] };
        }
        
        const genderAgeData = response.data.results[0];
        
        // Directly use the gender and age arrays from the API response
        const transformedData: GenderAgeTrendData = {
          genderGroups: genderAgeData.gender,
          ageGroups: genderAgeData.age
        };
        
        // Validate the transformed data
        const validationResult = GenderAgeTrendDataSchema.safeParse(transformedData);
        if (!validationResult.success) {
            console.error("Data validation failed for gender/age trend:", validationResult.error);
            // Return empty data to prevent app crashes
            return { genderGroups: [], ageGroups: [] };
        }

        return validationResult.data;

    } catch (err: any) {
        console.error('Error fetching Naver DataLab gender/age data:', err.response?.data || err.message);
        // On error, return empty data to prevent app crashes but still allow caching logic to work if needed.
        const emptyData = { genderGroups: [], ageGroups: [] };
        return emptyData;
    }
  }
);
