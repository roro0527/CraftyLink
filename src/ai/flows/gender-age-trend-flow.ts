
'use server';
/**
 * @fileOverview A gender and age trend analysis agent using Naver DataLab Search API.
 *
 * - getGenderAgeTrend - A function that handles fetching and processing gender and age trend data.
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
  age: z.array(
    z.object({
        group: z.string().describe('The age group (e.g., "10대").'),
        ratio: z.number().describe('The search ratio for the age group.'),
    })
  )
});
export type GenderAgeTrendData = z.infer<typeof GenderAgeTrendDataSchema>;

async function fetchTrend(keyword: string, startDate: string, endDate: string, gender: 'm' | 'f' | '', ages: string[]): Promise<number> {
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
    ages,
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
      // The API returns a ratio for each period. We'll average them for the overall trend.
      return results.reduce((sum: number, item: any) => sum + item.ratio, 0) / results.length;
    }
    return 0;
  } catch (err: any) {
    console.error(`Error fetching Naver DataLab data for gender ${gender} & ages ${ages.join(',')}:`, err.response?.data || err.message);
    return 0;
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
      fetchTrend(keyword, formattedStartDate, formattedEndDate, 'm', []),
      fetchTrend(keyword, formattedStartDate, formattedEndDate, 'f', []),
    ]);

    const ageGroups = [
        { name: '10대', codes: ['10', '15'] },
        { name: '20대', codes: ['20', '25'] },
        { name: '30대', codes: ['30', '35'] },
        { name: '40대', codes: ['40', '45'] },
        { name: '50대', codes: ['50', '55'] },
        { name: '60대 이상', codes: ['60'] },
    ];

    const ageRatios = await Promise.all(
        ageGroups.map(group => fetchTrend(keyword, formattedStartDate, formattedEndDate, '', group.codes))
    );

    return {
      gender: [
        { group: '남성', ratio: maleRatio },
        { group: '여성', ratio: femaleRatio },
      ],
      age: ageRatios.map((ratio, index) => ({
        group: ageGroups[index].name,
        ratio: ratio,
      }))
    };
  }
);


export async function getGenderAgeTrend(input: GenderAgeTrendInput): Promise<GenderAgeTrendData> {
  return getGenderAgeTrendFlow(input);
}
