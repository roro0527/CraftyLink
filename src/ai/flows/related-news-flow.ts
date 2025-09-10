
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
    url: z.string().url().describe('The URL of the news article.'),
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
    const prompt = `You must use the googleSearch tool to find the latest news. Find 3 news articles related to the keyword '${input.keyword}'. Provide the title, a short summary, and the original article's URL for each.`;
    
    const { output } = await ai.generate({
        prompt,
        model: 'googleai/gemini-1.5-flash',
        tools: ['googleSearch'],
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
