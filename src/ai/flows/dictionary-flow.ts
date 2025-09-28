
'use server';
/**
 * @fileOverview Genkit 플로우를 사용하여 사전 항목을 생성하는 AI 에이전트입니다.
 *
 * - getDictionaryEntry: 키워드에 대한 사전 항목을 조회하는 공개 함수입니다.
 * - DictionaryInput: getDictionaryEntry 함수의 입력 타입입니다.
 * - DictionaryEntry: getDictionaryEntry 함수의 반환 타입입니다.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// 입력 스키마 정의: 문자열 'keyword'를 필드로 가집니다.
const DictionaryInputSchema = z.object({
  keyword: z.string().describe('The keyword to look up in the dictionary.'),
});
export type DictionaryInput = z.infer<typeof DictionaryInputSchema>;

// 출력 스키마 정의: 단어, 정의, 어원, 예문 등을 포함하는 사전 항목의 구조를 정의합니다.
const DictionaryEntrySchema = z.object({
  word: z.string().describe('The keyword itself.'),
  definition: z.string().describe('A concise definition of the keyword.'),
  etymology: z.string().optional().describe('The origin or history of the word.'),
  examples: z.array(z.string()).describe('A list of up to 3 example sentences using the keyword.'),
});
export type DictionaryEntry = z.infer<typeof DictionaryEntrySchema>;

// Genkit 프롬프트를 정의합니다.
const dictionaryPrompt = ai.definePrompt({
    name: 'dictionaryPrompt', // 프롬프트의 고유 이름
    input: { schema: DictionaryInputSchema }, // 입력 데이터의 스키마
    output: { schema: DictionaryEntrySchema }, // 원하는 출력 데이터의 스키마
    // 실제 언어 모델에게 전달될 프롬프트 템플릿입니다.
    prompt: `
        You are a helpful dictionary.
        For the given keyword, provide a clear and concise dictionary entry.
        Include the definition, etymology (if interesting or known), and 2-3 example sentences.
        The response should be in Korean.

        Keyword: {{{keyword}}}
    `,
});

/**
 * 사전 항목을 생성하는 핵심 Genkit 플로우입니다.
 * 이 플로우는 dictionaryPrompt를 호출하여 AI 모델로부터 구조화된 응답을 받습니다.
 */
export const getDictionaryEntryFlow = ai.defineFlow(
  {
    name: 'getDictionaryEntryFlow', // 플로우의 고유 이름
    inputSchema: DictionaryInputSchema,
    outputSchema: DictionaryEntrySchema,
  },
  async (input) => {
    // 프롬프트를 실행하고 결과를 받습니다.
    const { output } = await dictionaryPrompt(input);
    // 출력이 없는 경우 에러를 발생시킵니다.
    if (!output) {
      throw new Error('Failed to generate dictionary entry from AI.');
    }
    return output;
  }
);

/**
 * 클라이언트(서버 액션)에서 호출할 공개 함수입니다.
 * 내부적으로 getDictionaryEntryFlow를 실행하고, 에러 발생 시 안전한 대체값을 반환합니다.
 * @param input 검색할 키워드를 포함하는 객체
 * @returns AI가 생성한 사전 항목 또는 에러 발생 시 대체 객체
 */
export async function getDictionaryEntry(input: DictionaryInput): Promise<DictionaryEntry> {
  try {
    return await getDictionaryEntryFlow(input);
  } catch (error) {
    console.error('Error in getDictionaryEntry flow:', error);
    // 에러가 발생해도 앱이 중단되지 않도록, 스키마에 맞는 에러 객체를 반환합니다.
    return {
        word: input.keyword,
        definition: '오류: 이 단어에 대한 정의를 생성하지 못했습니다.',
        examples: [],
    };
  }
}
