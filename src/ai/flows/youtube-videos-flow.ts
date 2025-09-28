
'use server';
/**
 * @fileOverview Genkit 플로우를 사용하여 YouTube Data API로부터 동영상 정보를 가져오는 에이전트입니다.
 *
 * - getYoutubeVideos: 특정 키워드로 유튜브 영상을 검색하는 공개 함수입니다.
 * - YoutubeVideosInput: getYoutubeVideos 함수의 입력 타입입니다.
 * - YoutubeVideosData: getYoutubeVideos 함수의 반환 타입입니다.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { google } from 'googleapis';

// 입력 스키마 정의: 'keyword'와 페이지네이션을 위한 'pageToken'을 필드로 가집니다.
const YoutubeVideosInputSchema = z.object({
  keyword: z.string().describe('The keyword to search for on YouTube.'),
  pageToken: z.string().optional().describe('The page token for fetching subsequent pages.'),
});
export type YoutubeVideosInput = z.infer<typeof YoutubeVideosInputSchema>;

// 개별 유튜브 비디오 데이터의 스키마를 정의합니다.
const YoutubeVideoSchema = z.object({
    id: z.string(),
    title: z.string(),
    publishedAt: z.string(),
    viewCount: z.string(),
    channelTitle: z.string(),
});

// 출력 스키마 정의: 비디오 데이터 배열과 다음 페이지 토큰을 포함합니다.
const YoutubeVideosDataSchema = z.object({
    videos: z.array(YoutubeVideoSchema),
    nextPageToken: z.string().optional().nullable(),
});
export type YoutubeVideosData = z.infer<typeof YoutubeVideosDataSchema>;

/**
 * YouTube Data API를 호출하여 동영상을 검색하고 상세 정보를 가져오는 핵심 Genkit 플로우입니다.
 */
const getYoutubeVideosFlow = ai.defineFlow(
  {
    name: 'getYoutubeVideosFlow',
    inputSchema: YoutubeVideosInputSchema,
    outputSchema: YoutubeVideosDataSchema,
  },
  async (input) => {
    // googleapis 라이브러리를 사용하여 YouTube API 클라이언트를 초기화합니다.
    const youtube = google.youtube({
        version: 'v3',
        auth: process.env.YOUTUBE_API_KEY, // 환경 변수에서 API 키 사용
    });

    try {
        // 1. search.list API를 호출하여 키워드로 비디오 ID 목록을 가져옵니다.
        const searchResponse = await youtube.search.list({
            part: ['snippet'],
            q: input.keyword,
            type: ['video'],
            maxResults: 12, // 한 번에 12개 결과 요청
            order: 'relevance', // 관련도순 정렬
            pageToken: input.pageToken,
        });

        const videoIds = searchResponse.data.items?.map(item => item.id?.videoId).filter((id): id is string => !!id) || [];
        
        if (videoIds.length === 0) {
            return { videos: [], nextPageToken: null };
        }

        // 2. videos.list API를 호출하여 비디오 ID 목록에 대한 상세 정보(통계 포함)를 가져옵니다.
        const videosResponse = await youtube.videos.list({
            part: ['snippet', 'statistics'],
            id: videoIds,
        });

        // API 응답을 YoutubeVideoSchema에 맞게 매핑합니다.
        const videoDetails = videosResponse.data.items?.map(item => {
            return {
                id: item.id || '',
                title: item.snippet?.title || 'No Title',
                publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
                viewCount: item.statistics?.viewCount || '0',
                channelTitle: item.snippet?.channelTitle || 'No Channel',
            };
        }) || [];
        
        // 최종 데이터와 다음 페이지 토큰을 반환합니다.
        return {
            videos: videoDetails,
            nextPageToken: searchResponse.data.nextPageToken
        };

    } catch (err) {
        console.error('Error fetching YouTube data:', err);
        // API 에러(예: 할당량 초과) 발생 시 앱 충돌을 막기 위해 빈 데이터를 반환합니다.
        return { videos: [], nextPageToken: null };
    }
  }
);

/**
 * 클라이언트(서버 액션)에서 호출할 공개 함수입니다.
 * 내부적으로 getYoutubeVideosFlow를 실행합니다.
 * @param input 검색할 키워드와 페이지 토큰을 포함하는 객체
 * @returns 유튜브 비디오 데이터와 다음 페이지 토큰을 포함하는 객체
 */
export async function getYoutubeVideos(input: YoutubeVideosInput): Promise<YoutubeVideosData> {
  return getYoutubeVideosFlow(input);
}
