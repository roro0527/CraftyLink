
'use server';
/**
 * @fileOverview A keyword gender/age analysis agent using Naver DataLab API.
 *
 * - getGenderAgeTrend - A function that fetches gender and age trend data for a keyword.
 */

import { ai } from '@/ai/genkit';
import axios from 'axios';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { GenderAgeTrendDataSchema, GenderAgeTrendInputSchema } from '@/lib/types';
import type { GenderAgeTrendData, GenderAgeTrendInput } from '@/lib/types';


const CACHE_TTL_HOURS = 24;

const genderAgeTrendFlow = ai.defineFlow(
  {
    name: 'genderAgeTrendFlow',
    inputSchema: GenderAgeTrendInputSchema,
    outputSchema: GenderAgeTrendDataSchema,
  },
  async (input): Promise<GenderAgeTrendData> => {
    const { keyword, startDate, endDate } = input;
    const firestore = getAdminFirestore();
    const cacheKey = `gender-age-${keyword}-${startDate}-${endDate}`.replace(/[^a-zA-Z0-9-]/g, "");
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
                console.log(`Returning cached gender/age data for: ${keyword}`);
                return cacheData.data as GenderAgeTrendData;
            }
        }
    } catch (e) {
        console.error("Cache read error for gender/age, proceeding to fetch from API:", e);
    }
    

    // 2. Fetch from API
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
        
        const data: GenderAgeTrendData = {
            genderGroups: results.data.map((g: any) => ({ group: g.group, ratio: g.ratio })),
            ageGroups: results.age.map((a: any) => ({ group: a.group, ratio: a.ratio })),
        };
        
        const genderAgeData = response.data.results[0];
        const transformedData: GenderAgeTrendData = {
          genderGroups: genderAgeData.gender,
          ageGroups: genderAgeData.age
        };


        // 3. Update cache
        await cacheRef.set({
            data: transformedData,
            updatedAt: new Date(),
        });
        
        return transformedData;

    } catch (err: any) {
        console.error('Error fetching Naver DataLab gender/age data:', err.response?.data || err.message);
        // On error, return empty data to prevent app crashes but still allow caching logic to work if needed.
        const emptyData = { genderGroups: [], ageGroups: [] };
        return emptyData;
    }
  }
);


export async function getGenderAgeTrend(input: GenderAgeTrendInput): Promise<GenderAgeTrendData> {
  return genderAgeTrendFlow(input);
}
