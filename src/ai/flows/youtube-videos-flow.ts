
'use server';
/**
 * @fileOverview A YouTube video search AI agent.
 *
 * - getYoutubeVideos - A function that handles fetching top YouTube videos for a keyword.
 * - YoutubeVideosInput - The input type for the getYoutubeVideos function.
 * - YoutubeVideosData - The return type for the getYoutubeVideos function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { google } from 'googleapis';
import type { YoutubeVideo } from '@/lib/types';


const YoutubeVideosInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for on YouTube.'),
});
export type YoutubeVideosInput = z.infer<typeof YoutubeVideosInputSchema>;

const YoutubeVideoSchema = z.object({
    title: z.string(),
    publishedAt: z.string(),
    viewCount: z.string(),
    channelTitle: z.string(),
});

const YoutubeVideosDataSchema = z.array(YoutubeVideoSchema);
export type YoutubeVideosData = z.infer<typeof YoutubeVideosDataSchema>;


const getYoutubeVideosFlow = ai.defineFlow(
  {
    name: 'getYoutubeVideosFlow',
    inputSchema: YoutubeVideosInputSchema,
    outputSchema: YoutubeVideosDataSchema,
  },
  async (input) => {
    const youtube = google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY,
    });

    try {
        const searchResponse = await youtube.search.list({
            part: ['snippet'],
            q: input.keyword,
            type: ['video'],
            maxResults: 5,
            order: 'relevance',
        });

        const videoIds = searchResponse.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || [];
        
        if (videoIds.length === 0) {
            return [];
        }

        const videosResponse = await youtube.videos.list({
            part: ['snippet', 'statistics'],
            id: videoIds,
        });

        const videoDetails: YoutubeVideosData = videosResponse.data.items?.map(item => ({
            title: item.snippet?.title || 'No Title',
            publishedAt: item.snippet?.publishedAt || '',
            viewCount: item.statistics?.viewCount || '0',
            channelTitle: item.snippet?.channelTitle || 'No Channel',
        })) || [];
        
        return videoDetails;

    } catch (err) {
        console.error('Error fetching YouTube data:', err);
        // In case of API errors (e.g., quota exceeded), return an empty array.
        return [];
    }
  }
);

export async function getYoutubeVideos(input: YoutubeVideosInput): Promise<YoutubeVideosData> {
  return getYoutubeVideosFlow(input);
}
