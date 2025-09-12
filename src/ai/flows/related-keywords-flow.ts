
'use server';
/**
 * @fileOverview A related keywords agent using a generative AI model.
 *
 * - getRelatedKeywords - A function that handles fetching related keywords.
 * - RelatedKeywordsInput - The input type for the getRelatedKeywords function.
 * - RelatedKeywordsData - The return type for the getRelatedKeywords function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const RelatedKeywordsInputSchema = z.object({
  keyword: z.string().describe('The keyword to find related queries for.'),
});
export type RelatedKeywordsInput = z.infer<typeof RelatedKeywordsInputSchema>;

const RelatedKeywordsDataSchema = z.object({
    tags: z.array(z.string()).describe('A list of 5 related keywords or tags.'),
});
export type RelatedKeywordsData = z.infer<typeof RelatedKeywordsDataSchema>;

const relatedKeywordsPrompt = ai.definePrompt(
  {
    name: 'relatedKeywordsPrompt',
    input: { schema: RelatedKeywordsInputSchema },
    output: { schema: RelatedKeywordsDataSchema },
    prompt: `사용자가 제공한 키워드와 관련성이 높은 검색어 또는 태그 5개를 생성해줘. 답변은 다른 설명 없이 태그 목록만 포함해야 해.

키워드: {{{keyword}}}`,
  },
);

export async function getRelatedKeywords(input: RelatedKeywordsInput): Promise<string[]> {
  try {
    const { output } = await relatedKeywordsPrompt(input);
    if (!output) {
      console.warn(`No related keywords could be generated for: ${input.keyword}`);
      return [];
    }
    // Assuming the AI returns the tags in the 'tags' field as defined in the schema.
    return output.tags;
  } catch (error) {
    console.error('Error generating related keywords from AI:', error);
    // Return an empty array on error to prevent app crashes
    return [];
  }
}
