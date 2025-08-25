
'use server';
/**
 * @fileOverview A related keywords AI agent.
 *
 * - getRelatedKeywords - A function that handles fetching related keywords.
 * - RelatedKeywordsInput - The input type for the getRelatedKeywords function.
 * - RelatedKeywordsData - The return type for the getRelatedKeywords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import googleTrends from 'google-trends-api';

const RelatedKeywordsInputSchema = z.object({
  keyword: z.string().describe('The keyword to find related queries for.'),
});
export type RelatedKeywordsInput = z.infer<typeof RelatedKeywordsInputSchema>;

const RelatedKeywordsDataSchema = z.array(z.string()).describe('A list of related keywords.');
export type RelatedKeywordsData = z.infer<typeof RelatedKeywordsDataSchema>;

const getRelatedKeywordsFlow = ai.defineFlow(
  {
    name: 'getRelatedKeywordsFlow',
    inputSchema: RelatedKeywordsInputSchema,
    outputSchema: RelatedKeywordsDataSchema,
  },
  async (input) => {
    try {
      const results = await googleTrends.relatedQueries({
        keyword: input.keyword,
      });
      const parsedResults = JSON.parse(results);
      const rankedList = parsedResults.default.rankedKeyword;

      if (Array.isArray(rankedList) && rankedList.length > 0) {
        // rankedKeyword could be an array of "top" or "rising"
        // Let's find the one that has data.
        const listWithQueries = rankedList.find(item => item.rankedKeyword && item.rankedKeyword.length > 0);
        if (listWithQueries) {
             return listWithQueries.rankedKeyword.slice(0, 5).map((item: any) => item.query);
        }
      }
      
      return [];

    } catch (err) {
      console.error('Error fetching related keywords from Google Trends:', err);
      return [];
    }
  }
);

export async function getRelatedKeywords(input: RelatedKeywordsInput): Promise<RelatedKeywordsData> {
  return getRelatedKeywordsFlow(input);
}
