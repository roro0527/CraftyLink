
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
import { differenceInDays, parseISO } from 'date-fns';


const YoutubeVideosInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for on YouTube.'),
});
export type YoutubeVideosInput = z.infer<typeof YoutubeVideosInputSchema>;

const YoutubeVideoSchema = z.object({
    id: z.string(),
    title: z.string(),
    publishedAt: z.string(),
    viewCount: z.string(),
    channelTitle: z.string(),
    growthRate: z.number().optional(),
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
            maxResults: 25, // Fetch more results to calculate growth rate accurately
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

        const videoDetails: YoutubeVideosData = videosResponse.data.items?.map(item => {
            const viewCount = parseInt(item.statistics?.viewCount || '0', 10);
            const publishedAt = item.snippet?.publishedAt || new Date().toISOString();
            const daysSincePublished = differenceInDays(new Date(), parseISO(publishedAt));
            
            // Calculate growth rate: views per day.
            // If published within the last day, use viewCount itself to avoid division by zero and prioritize new videos.
            const growthRate = daysSincePublished > 0 ? viewCount / daysSincePublished : viewCount;

            return {
                id: item.id || '',
                title: item.snippet?.title || 'No Title',
                publishedAt: publishedAt,
                viewCount: item.statistics?.viewCount || '0',
                channelTitle: item.snippet?.channelTitle || 'No Channel',
                growthRate: growthRate
            };
        }) || [];
        
        // Sort by growth rate in descending order and take the top 5
        const sortedVideos = videoDetails.sort((a, b) => (b.growthRate || 0) - (a.growthRate || 0));
        
        return sortedVideos.slice(0, 5);

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
