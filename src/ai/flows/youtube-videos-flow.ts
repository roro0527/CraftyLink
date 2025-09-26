
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

const YoutubeVideosInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for on YouTube.'),
  pageToken: z.string().optional().describe('The page token for fetching subsequent pages.'),
});
export type YoutubeVideosInput = z.infer<typeof YoutubeVideosInputSchema>;

const YoutubeVideoSchema = z.object({
    id: z.string(),
    title: z.string(),
    publishedAt: z.string(),
    viewCount: z.string(),
    channelTitle: z.string(),
});

const YoutubeVideosDataSchema = z.object({
    videos: z.array(YoutubeVideoSchema),
    nextPageToken: z.string().optional().nullable(),
});
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
            maxResults: 12,
            order: 'relevance',
            pageToken: input.pageToken,
        });

        const videoIds = searchResponse.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || [];
        
        if (videoIds.length === 0) {
            return { videos: [], nextPageToken: null };
        }

        const videosResponse = await youtube.videos.list({
            part: ['snippet', 'statistics'],
            id: videoIds,
        });

        const videoDetails = videosResponse.data.items?.map(item => {
            return {
                id: item.id || '',
                title: item.snippet?.title || 'No Title',
                publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
                viewCount: item.statistics?.viewCount || '0',
                channelTitle: item.snippet?.channelTitle || 'No Channel',
            };
        }) || [];
        
        return {
            videos: videoDetails,
            nextPageToken: searchResponse.data.nextPageToken
        };

    } catch (err) {
        console.error('Error fetching YouTube data:', err);
        // In case of API errors (e.g., quota exceeded), return an empty array.
        return { videos: [], nextPageToken: null };
    }
  }
);

export async function getYoutubeVideos(input: YoutubeVideosInput): Promise<YoutubeVideosData> {
  return getYoutubeVideosFlow(input);
}
