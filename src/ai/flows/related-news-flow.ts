
'use server';
/**
 * @fileOverview A related news fetching AI agent.
 *
 * - getRelatedNews - A function that handles fetching related news articles.
 * - RelatedNewsInput - The input type for the getRelatedNews function.
 * - RelatedNewsData - The return type for the getRelatedNews function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const RelatedNewsInputSchema = z.object({
  keyword: z.string().describe('The keyword to find news articles for.'),
});
export type RelatedNewsInput = z.infer<typeof RelatedNewsInputSchema>;

const NewsArticleSchema = z.object({
    title: z.string().describe('The title of the news article.'),
    summary: z.string().describe('A brief summary of the news article.'),
});

const RelatedNewsDataSchema = z.array(NewsArticleSchema).describe('A list of related news articles.');
export type RelatedNewsData = z.infer<typeof RelatedNewsDataSchema>;


const getRelatedNewsFlow = ai.defineFlow(
  {
    name: 'getRelatedNewsFlow',
    inputSchema: RelatedNewsInputSchema,
    outputSchema: RelatedNewsDataSchema,
  },
  async (input) => {
    const prompt = `최신 뉴스를 바탕으로 키워드 '${input.keyword}'와(과) 관련된 뉴스 기사 3개를 찾아서 각각 제목과 짧은 요약을 제공해줘.`;
    
    const { output } = await ai.generate({
        prompt,
        output: {
            schema: RelatedNewsDataSchema,
        }
    });

    return output || [];
  }
);

export async function getRelatedNews(input: RelatedNewsInput): Promise<RelatedNewsData> {
  return getRelatedNewsFlow(input);
}
