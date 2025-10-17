
'use server';
/**
 * @fileOverview Genkit 플로우를 사용하여 Google Custom Search API로부터 이미지를 가져오는 에이전트입니다.
 *
 * - getGoogleImages: 특정 키워드와 관련된 이미지를 조회하는 공개 함수입니다.
 * - GoogleImagesInput: getGoogleImages 함수의 입력 타입입니다.
 * - GoogleImagesData: getGoogleImages 함수의 반환 타입입니다.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import axios from 'axios';
import type { SearchResult } from '@/lib/types';

// 입력 스키마 정의
export const GoogleImagesInputSchema = z.object({
  query: z.string().describe('The keyword to search images for.'),
  start: z.number().optional().describe('The starting index for search results.'),
});
export type GoogleImagesInput = z.infer<typeof GoogleImagesInputSchema>;

// 개별 이미지 결과 스키마
const ImageSearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  imageUrl: z.string(),
  description: z.string().optional(),
  source: z.string().optional(),
});

// 최종 출력 데이터 스키마
export const GoogleImagesDataSchema = z.object({
  photos: z.array(ImageSearchResultSchema),
  nextPage: z.number().optional().nullable(),
});
export type GoogleImagesData = z.infer<typeof GoogleImagesDataSchema>;


/**
 * Google Custom Search API를 호출하여 이미지 검색 결과를 가져오는 핵심 Genkit 플로우입니다.
 */
const getGoogleImagesFlow = ai.defineFlow(
  {
    name: 'getGoogleImagesFlow',
    inputSchema: GoogleImagesInputSchema,
    outputSchema: GoogleImagesDataSchema,
  },
  async (input) => {
    const { query, start = 1 } = input;

    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const cseId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

    if (!apiKey || !cseId) {
      console.error("Google Custom Search API Key or Engine ID is not configured.");
      throw new Error("Server configuration error for Google Images.");
    }

    const url = "https://www.googleapis.com/customsearch/v1";

    try {
      const response = await axios.get(url, {
        params: {
          key: apiKey,
          cx: cseId,
          q: query,
          searchType: "image",
          num: 10,
          start: start,
        },
      });

      const items = response.data.items || [];
      const searchResult: SearchResult[] = items.map((item: any) => ({
        id: item.cacheId || `${item.link}-${Math.random()}`,
        title: item.title,
        url: item.image.contextLink,
        imageUrl: item.link, // Direct image link
        description: item.snippet,
        source: item.displayLink,
      }));
      
      const nextPageIndex = response.data.queries?.nextPage?.[0]?.startIndex;

      return {
        photos: searchResult,
        nextPage: nextPageIndex,
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Google Custom Search API call failed:", error.response?.data || error.message);
        throw new Error("Failed to fetch images from Google API.");
      }
      console.error("An unexpected error occurred while fetching Google Images:", error);
      throw new Error("An unexpected error occurred during image search.");
    }
  }
);


/**
 * 클라이언트(서버 액션)에서 호출할 공개 함수입니다.
 * 내부적으로 getGoogleImagesFlow를 실행합니다.
 * @param input 검색할 키워드와 시작 인덱스를 포함하는 객체
 * @returns 이미지 데이터와 다음 페이지 인덱스를 포함하는 객체
 */
export async function getGoogleImages(input: GoogleImagesInput): Promise<GoogleImagesData> {
  return getGoogleImagesFlow(input);
}
