
'use server';
/**
 * @fileOverview Genkit 플로우를 사용하여 Google Custom Search API를 통해 이미지를 검색하는 에이전트입니다.
 * 이 플로우는 서버 측에서 실행되므로 클라이언트의 CORS 정책 문제를 우회합니다.
 *
 * - getGoogleImages: 이미지를 검색하는 공개 함수입니다.
 * - GoogleImagesInput: getGoogleImages 함수의 입력 타입입니다.
 * - GoogleImagesData: getGoogleImages 함수의 반환 타입입니다.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import axios from 'axios';
import type { SearchResult } from '@/lib/types';

// 입력 스키마 정의: 'query'와 선택적 'start' 인덱스를 가집니다.
const GoogleImagesInputSchema = z.object({
  query: z.string().describe('The search query.'),
  start: z.number().optional().default(1).describe('The starting index for results.'),
});
export type GoogleImagesInput = z.infer<typeof GoogleImagesInputSchema>;

// 출력 스키마 정의: 이미지 검색 결과 배열과 다음 페이지 인덱스를 포함합니다.
const GoogleImagesDataSchema = z.object({
    photos: z.array(z.object({
        id: z.string(),
        title: z.string(),
        url: z.string(),
        imageUrl: z.string(),
        description: z.string(),
        source: z.string(),
    })),
    nextPage: z.number().optional().nullable(),
});
export type GoogleImagesData = z.infer<typeof GoogleImagesDataSchema>;

/**
 * Google Custom Search API를 호출하여 이미지 검색을 수행하는 핵심 Genkit 플로우입니다.
 */
const getGoogleImagesFlow = ai.defineFlow(
  {
    name: 'getGoogleImagesFlow',
    inputSchema: GoogleImagesInputSchema,
    outputSchema: GoogleImagesDataSchema,
  },
  async (input) => {
    const { query, start } = input;

    // 환경 변수에서 API 키와 검색 엔진 ID를 가져옵니다.
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const cseId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

    // 필수 환경 변수가 없는 경우 에러를 던집니다.
    if (!apiKey || !cseId) {
      console.error("Google Custom Search API Key or Engine ID is not configured in environment variables.");
      throw new Error("Server configuration error for Google Images search.");
    }

    const url = "https://www.googleapis.com/customsearch/v1";

    try {
      // axios를 사용하여 서버 측에서 API를 호출합니다.
      const response = await axios.get(url, {
        params: {
          key: apiKey,
          cx: cseId,
          q: query,
          searchType: "image",
          num: 10, // 한 번에 10개의 결과를 가져옵니다.
          start: start,
        },
      });

      const items = response.data.items || [];
      // API 응답을 SearchResult 타입에 맞게 매핑합니다.
      const searchResult: SearchResult[] = items.map((item: any) => ({
        id: item.cacheId || item.link, // cacheId가 없으면 고유한 link를 id로 사용
        title: item.title,
        url: item.image.contextLink,
        imageUrl: item.link, // 직접적인 이미지 링크
        description: item.snippet,
        source: item.displayLink,
      }));
      
      // 다음 페이지 시작 인덱스를 추출합니다.
      const nextPageIndex = response.data.queries?.nextPage?.[0]?.startIndex;

      return { 
          photos: searchResult,
          nextPage: nextPageIndex,
      };

    } catch (error) {
      // 에러 처리
      if (axios.isAxiosError(error)) {
        console.error("Google Custom Search API call failed:", error.response?.data || error.message);
        throw new Error(`Failed to fetch images from Google. Details: ${error.response?.data?.error?.message || error.message}`);
      }
      console.error("An unexpected error occurred while fetching Google Images:", error);
      throw new Error("An unexpected error occurred while fetching images.");
    }
  }
);

/**
 * 클라이언트(서버 액션)에서 호출할 공개 함수입니다.
 * 내부적으로 getGoogleImagesFlow를 실행합니다.
 * @param input 검색어와 시작 인덱스를 포함하는 객체
 * @returns 이미지 검색 결과 데이터
 */
export async function getGoogleImages(input: GoogleImagesInput): Promise<GoogleImagesData> {
  return getGoogleImagesFlow(input);
}
