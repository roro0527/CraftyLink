'use server';
/**
 * @fileOverview Saves keyword analysis data to Firestore.
 *
 * - saveKeywordData - Saves the complete analysis data for a given keyword.
 * - SaveKeywordDataInput - The input type for the saveKeywordData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getAdminFirestore } from '@/lib/firebase-admin';
import type { KeywordTrendsData } from './keyword-trends-flow';
import type { YoutubeVideosData } from './youtube-videos-flow';

const SaveKeywordDataInputSchema = z.object({
  keyword: z.string(),
  trendData: z.custom<KeywordTrendsData>(),
  youtubeVideos: z.custom<YoutubeVideosData>(),
  relatedKeywords: z.array(z.string()),
});
export type SaveKeywordDataInput = z.infer<typeof SaveKeywordDataInputSchema>;


const saveKeywordDataFlow = ai.defineFlow(
  {
    name: 'saveKeywordDataFlow',
    inputSchema: SaveKeywordDataInputSchema,
    outputSchema: z.object({ success: z.boolean(), docId: z.string().optional() }),
  },
  async (input) => {
    try {
      const db = getAdminFirestore();
      const docRef = await db.collection('keyword_searches').add({
        keyword: input.keyword,
        savedAt: new Date(),
        trendData: input.trendData,
        youtubeVideos: input.youtubeVideos,
        relatedKeywords: input.relatedKeywords,
      });

      console.log(`Successfully saved keyword data for "${input.keyword}" with doc ID: ${docRef.id}`);
      return { success: true, docId: docRef.id };

    } catch (error) {
      console.error('Error saving keyword data to Firestore:', error);
      return { success: false };
    }
  }
);

export async function saveKeywordData(input: SaveKeywordDataInput): Promise<{ success: boolean, docId?: string }> {
  return saveKeywordDataFlow(input);
}
