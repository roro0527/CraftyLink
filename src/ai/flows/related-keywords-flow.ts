
'use server';
/**
 * @fileOverview Genkit 플로우를 사용하여 생성형 AI 모델로부터 관련 키워드를 가져오는 에이전트입니다.
 *
 * - getRelatedKeywordsFlow: 특정 키워드와 관련된 키워드 5개를 생성하는 공개 함수입니다.
 * - RelatedKeywordsInput: getRelatedKeywordsFlow 함수의 입력 타입입니다.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// 입력 스키마 정의: 'keyword' 문자열을 필드로 가집니다.
const RelatedKeywordsInputSchema = z.object({
  keyword: z.string().describe('The keyword to find related queries for.'),
});
export type RelatedKeywordsInput = z.infer<typeof RelatedKeywordsInputSchema>;

// 출력 타입은 이제 간단한 문자열 배열입니다.
export type RelatedKeywordsData = string[];

/**
 * AI를 호출하여 관련 키워드를 생성하고, 그 결과를 가공하여 반환하는 Genkit 플로우입니다.
 */
export const getRelatedKeywordsFlow = ai.defineFlow(
  {
    name: 'getRelatedKeywordsFlow',
    inputSchema: RelatedKeywordsInputSchema,
    outputSchema: z.array(z.string()), // 최종 출력은 문자열 배열
  },
  async ({ keyword }) => {
    try {
      // Genkit 프롬프트를 플로우 내에서 직접 호출합니다.
      const response = await ai.generate({
        prompt: `사용자가 제공한 키워드와 관련성이 높은 검색어 또는 태그 5개를 쉼표로 구분된 하나의 문자열로 생성해줘. 다른 설명 없이 쉼표로 구분된 태그 목록만 반환해야 한다. 예: '태그1,태그2,태그3,태그4,태그5'. 키워드: ${keyword}`,
      });

      // AI의 응답 텍스트를 가져옵니다.
      const textResponse = response.text;
      
      if (!textResponse) {
        console.warn('AI did not return any text for related keywords.');
        return [];
      }

      // 쉼표로 구분된 문자열을 배열로 변환하고, 각 태그의 양쪽 공백을 제거합니다.
      const tags = textResponse.split(',').map(tag => tag.trim()).filter(tag => tag); // 비어있는 태그 제거

      return tags.slice(0, 5); // 최대 5개만 반환하도록 보장

    } catch (error) {
      console.error('Error generating related keywords from AI:', error);
      // 에러 발생 시 앱 충돌을 방지하기 위해 빈 배열을 반환합니다.
      return [];
    }
  }
);
