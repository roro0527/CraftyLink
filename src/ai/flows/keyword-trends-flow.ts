
'use server';
/**
 * @fileOverview Genkit 플로우를 사용하여 Naver DataLab API로부터 키워드 트렌드 데이터를 가져오는 에이전트입니다.
 *
 * - getKeywordTrends: 특정 기간 동안의 키워드 트렌드 데이터를 조회하는 공개 함수입니다.
 * - KeywordTrendsInput: getKeywordTrends 함수의 입력 타입입니다.
 * - KeywordTrendsData: getKeywordTrends 함수의 반환 타입입니다.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { subDays, format, parse } from 'date-fns';
import axios from 'axios';

// 입력 스키마 정의: 'keyword'와 'timeRange'를 필드로 가집니다.
const KeywordTrendsInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for.'),
  timeRange: z.enum(['5d', '1w', '2w', '1m']).default('1w').describe('The time range for the trend data.'),
});
export type KeywordTrendsInput = z.infer<typeof KeywordTrendsInputSchema>;

// 트렌드 데이터 포인트의 스키마를 정의합니다.
const KeywordTrendPointSchema = z.object({
  date: z.string().describe('The date for the data point (YYYY-MM-DD).'),
  value: z.number().describe('The search trend value.'),
});

// 출력 스키마 정의: 트렌드 데이터 포인트의 배열입니다.
const KeywordTrendsDataSchema = z.array(KeywordTrendPointSchema);
export type KeywordTrendsData = z.infer<typeof KeywordTrendsDataSchema>;

/**
 * Naver DataLab API를 호출하여 키워드 트렌드 데이터를 가져오는 핵심 Genkit 플로우입니다.
 */
const getKeywordTrendsFlow = ai.defineFlow(
  {
    name: 'getKeywordTrendsFlow',
    inputSchema: KeywordTrendsInputSchema,
    outputSchema: KeywordTrendsDataSchema,
  },
  async (input) => {
    const now = new Date();
    let daysToSubtract;
    // 입력된 timeRange에 따라 시작 날짜를 계산합니다.
    switch (input.timeRange) {
      case '5d': daysToSubtract = 5; break;
      case '1w': daysToSubtract = 7; break;
      case '2w': daysToSubtract = 14; break;
      case '1m': daysToSubtract = 30; break;
    }
    const startDate = subDays(now, daysToSubtract);
    const endDate = now;

    // Naver DataLab API 요청 본문을 생성합니다.
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
      // axios를 사용하여 서버 측에서 API를 호출합니다.
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

      // API 응답을 KeywordTrendPoint 스키마에 맞게 매핑합니다.
      // Naver API는 조회 기간 내 검색량이 가장 많은 시점을 100으로 설정하고 나머지는 상대적인 값으로 반환합니다.
      return trendData.map((item: { period: string; ratio: number }) => ({
        date: item.period,
        value: item.ratio,
      }));

    } catch (err: any) {
      console.error('Error fetching Naver DataLab data:', err.response?.data || err.message);
      // 에러 발생 시 앱 충돌을 방지하기 위해 빈 배열을 반환합니다.
      return [];
    }
  }
);

/**
 * 클라이언트(서버 액션)에서 호출할 공개 함수입니다.
 * 내부적으로 getKeywordTrendsFlow를 실행합니다.
 * @param input 검색할 키워드와 기간을 포함하는 객체
 * @returns 키워드 트렌드 데이터 배열
 */
export async function getKeywordTrends(input: KeywordTrendsInput): Promise<KeywordTrendsData> {
  return getKeywordTrendsFlow(input);
}
