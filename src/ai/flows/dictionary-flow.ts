
'use server';
/**
 * @fileOverview A dictionary agent that uses a generative AI model.
 *
 * - getDictionaryEntry - A function that fetches a dictionary entry for a keyword.
 * - DictionaryInput - The input type for the getDictionaryEntry function.
 * - DictionaryEntry - The return type for the getDictionaryEntry function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const DictionaryInputSchema = z.object({
  keyword: z.string().describe('The keyword to look up in the dictionary.'),
});
export type DictionaryInput = z.infer<typeof DictionaryInputSchema>;

const DictionaryEntrySchema = z.object({
  word: z.string().describe('The keyword itself.'),
  definition: z.string().describe('A concise definition of the keyword.'),
  etymology: z.string().optional().describe('The origin or history of the word.'),
  examples: z.array(z.string()).describe('A list of up to 3 example sentences using the keyword.'),
});
export type DictionaryEntry = z.infer<typeof DictionaryEntrySchema>;


const dictionaryPrompt = ai.definePrompt({
    name: 'dictionaryPrompt',
    input: { schema: DictionaryInputSchema },
    output: { schema: DictionaryEntrySchema },
    prompt: `
        You are a helpful dictionary.
        For the given keyword, provide a clear and concise dictionary entry.
        Include the definition, etymology (if interesting or known), and 2-3 example sentences.
        The response should be in Korean.

        Keyword: {{{keyword}}}
    `,
});

export const getDictionaryEntryFlow = ai.defineFlow(
  {
    name: 'getDictionaryEntryFlow',
    inputSchema: DictionaryInputSchema,
    outputSchema: DictionaryEntrySchema,
  },
  async (input) => {
    const { output } = await dictionaryPrompt(input);
    if (!output) {
      throw new Error('Failed to generate dictionary entry from AI.');
    }
    return output;
  }
);


export async function getDictionaryEntry(input: DictionaryInput): Promise<DictionaryEntry> {
  try {
    return await getDictionaryEntryFlow(input);
  } catch (error) {
    console.error('Error in getDictionaryEntry flow:', error);
    // Provide a fallback error object that matches the schema
    return {
        word: input.keyword,
        definition: '오류: 이 단어에 대한 정의를 생성하지 못했습니다.',
        examples: [],
    };
  }
}
