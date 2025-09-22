
'use server';
/**
 * @fileOverview A gender and age trend analysis agent using Naver DataLab Search API.
 *
 * - getGenderAgeTrend - A function that handles fetching and processing gender trend data.
 * - GenderAgeTrendInput - The input type for the getGenderAgeTrend function.
 * - GenderAgeTrendData - The return type for the getGenderAgeTrend function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import axios from 'axios';
import { subMonths, format } from 'date-fns';

const GenderAgeTrendInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for.'),
});
export type GenderAgeTrendInput = z.infer<typeof GenderAgeTrendInputSchema>;

const GenderAgeTrendDataSchema = z.object({
  gender: z.array(
    z.object({
      group: z.string().describe('The gender group (e.g., "남성", "여성").'),
      ratio: z.number().describe('The search ratio for the gender group.'),
    })
  ),
});
export type GenderAgeTrendData = z.infer<typeof GenderAgeTrendDataSchema>;

async function fetchTrendForGender(keyword: string, gender: 'm' | 'f', startDate: string, endDate: string): Promise<number> {
  const requestBody = {
    startDate,
    endDate,
    timeUnit: 'month',
    keywordGroups: [
      {
        groupName: keyword,
        keywords: [keyword],
      },
    ],
    gender,
    ages: [], // 모든 연령대
  };

  try {
    const response = await axios.post('https://openapi.naver.com/v1/datalab/search', requestBody, {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_DATALAB_CLIENT_ID,
        'X-Naver-Client-Secret': process.env.NAVER_DATALAB_CLIENT_SECRET,
        'Content-Type': 'application/json',
      },
    });

    const results = response.data.results[0]?.data;
    if (results && results.length > 0) {
      // 월 단위로 요청했으므로, 첫 번째 데이터의 비율을 사용
      return results[0].ratio;
    }
    return 0;
  } catch (err: any) {
    console.error(`Error fetching Naver DataLab data for gender ${gender}:`, err.response?.data || err.message);
    return 0; // 오류 발생 시 0을 반환
  }
}

const getGenderAgeTrendFlow = ai.defineFlow(
  {
    name: 'getGenderAgeTrendFlow',
    inputSchema: GenderAgeTrendInputSchema,
    outputSchema: GenderAgeTrendDataSchema,
  },
  async ({ keyword }) => {
    const endDate = new Date();
    const startDate = subMonths(endDate, 1);
    const formattedStartDate = format(startDate, 'yyyy-MM-dd');
    const formattedEndDate = format(endDate, 'yyyy-MM-dd');

    const [maleRatio, femaleRatio] = await Promise.all([
      fetchTrendForGender(keyword, 'm', formattedStartDate, formattedEndDate),
      fetchTrendForGender(keyword, 'f', formattedStartDate, formattedEndDate),
    ]);

    const totalRatio = maleRatio + femaleRatio;

    // 전체 비율이 0일 경우, 0으로 나눔을 방지
    if (totalRatio === 0) {
        return {
            gender: [
                { group: '남성', ratio: 0 },
                { group: '여성', ratio: 0 },
            ],
        };
    }
    
    // 비율을 백분율로 정규화
    const normalizedMaleRatio = (maleRatio / totalRatio) * 100;
    const normalizedFemaleRatio = (femaleRatio / totalRatio) * 100;

    return {
      gender: [
        { group: '남성', ratio: normalizedMaleRatio },
        { group: '여성', ratio: normalizedFemaleRatio },
      ],
    };
  }
);


export async function getGenderAgeTrend(input: GenderAgeTrendInput): Promise<GenderAgeTrendData> {
  return getGenderAgeTrendFlow(input);
}
