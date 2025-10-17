
'use server';
/**
 * @fileOverview Genkit 플로우를 사용하여 생성형 AI 모델로부터 관련 키워드를 가져오는 에이전트입니다.
 *
 * - getRelatedKeywords: 특정 키워드와 관련된 키워드 5개를 생성하는 공개 함수입니다.
 * - RelatedKeywordsInput: getRelatedKeywords 함수의 입력 타입입니다.
 * - RelatedKeywordsData: getRelatedKeywords 함수의 반환 타입입니다.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// 입력 스키마 정의: 'keyword' 문자열을 필드로 가집니다.
const RelatedKeywordsInputSchema = z.object({
  keyword: z.string().describe('The keyword to find related queries for.'),
});
export type RelatedKeywordsInput = z.infer<typeof RelatedKeywordsInputSchema>;

// 출력 스키마 정의: 문자열 배열인 'tags'를 필드로 가지는 객체입니다.
const RelatedKeywordsDataSchema = z.object({
    tags: z.array(z.string()).describe('A list of 5 related keywords or tags.'),
});
export type RelatedKeywordsData = z.infer<typeof RelatedKeywordsDataSchema>;

// Genkit 프롬프트를 정의합니다.
const relatedKeywordsPrompt = ai.definePrompt(
  {
    name: 'relatedKeywordsPrompt', // 프롬프트 고유 이름
    input: { schema: RelatedKeywordsInputSchema }, // 입력 스키마
    output: { schema: RelatedKeywordsDataSchema }, // 원하는 출력 스키마
    // 실제 언어 모델에게 전달될 프롬프트 템플릿입니다.
    prompt: `사용자가 제공한 키워드와 관련성이 높은 검색어 또는 태그 5개를 생성하여 JSON 형식으로 반환해줘.
응답은 반드시 'tags'라는 키를 가진 객체여야 하며, 값은 태그 문자열 배열이어야 해.
다른 설명 없이 JSON 객체만 반환해야 한다.

키워드: {{{keyword}}}`,
  },
);

/**
 * 클라이언트(서버 액션)에서 호출할 공개 함수입니다.
 * 내부적으로 relatedKeywordsPrompt를 실행하고, 에러 발생 시 안전한 대체값을 반환합니다.
 * @param input 검색할 키워드를 포함하는 객체
 * @returns AI가 생성한 관련 키워드 문자열 배열
 */
export async function getRelatedKeywords(input: RelatedKeywordsInput): Promise<string[]> {
  try {
    const { output } = await relatedKeywordsPrompt(input);
    // 출력이 없거나 tags가 없는 경우를 대비하여 빈 배열을 반환합니다.
    return output?.tags || [];
  } catch (error) {
    console.error('Error generating related keywords from AI:', error);
    // 에러 발생 시 앱 충돌을 방지하기 위해 빈 배열을 반환합니다.
    return [];
  }
}

