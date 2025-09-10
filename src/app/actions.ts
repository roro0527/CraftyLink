
'use server';

import type { SuperParam } from '@/lib/types';
import { getKeywordTrends, type KeywordTrendsInput, type KeywordTrendsData } from '@/ai/flows/keyword-trends-flow';
import { getRelatedKeywords, type RelatedKeywordsInput, type RelatedKeywordsData } from '@/ai/flows/related-keywords-flow';
import { getYoutubeVideos, type YoutubeVideosInput, type YoutubeVideosData } from '@/ai/flows/youtube-videos-flow';
import { getRegionalTrends, type RegionalTrendsInput, type RegionalTrendsOutput } from '@/ai/flows/regional-trends-flow';
import { getKeywordRegionRank, type KeywordRegionRankInput, type KeywordRegionRankOutput } from '@/ai/flows/keyword-region-rank-flow';
import { z } from 'zod';
import axios from 'axios';
import { headers } from 'next/headers';


export async function suggestSuperParametersAction(
  urls: string[]
): Promise<Omit<SuperParam, 'id'>[]> {
  if (!urls || urls.length === 0) {
    return [];
  }
  
  try {
    // The AI might return null or an empty object.
    return [];
  } catch (error) {
    console.error('Error suggesting super-parameters:', error);
    throw new Error('AI로부터 제안을 받아오지 못했습니다. 다시 시도해주세요.');
  }
}


export async function getKeywordTrendsAction(input: KeywordTrendsInput): Promise<KeywordTrendsData> {
  try {
    const trends = await getKeywordTrends(input);
    return trends;
  } catch (error) {
    console.error('Error fetching keyword trends:', error);
    // Let the calling function handle the error.
    throw error;
  }
}

export async function getRelatedKeywordsAction(input: RelatedKeywordsInput): Promise<RelatedKeywordsData> {
    try {
        const keywords = await getRelatedKeywords(input);
        return keywords;
    } catch (error) {
        console.error('Error fetching related keywords:', error);
        return [];
    }
}

export async function getYoutubeVideosAction(input: YoutubeVideosInput): Promise<YoutubeVideosData> {
    try {
        const videos = await getYoutubeVideos(input);
        return videos;
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        // In case of API errors (e.g., quota exceeded), return an empty array.
        return [];
    }
}

const NaverNewsInputSchema = z.object({
  keyword: z.string().describe('The keyword to find news articles for.'),
});
export type NaverNewsInput = z.infer<typeof NaverNewsInputSchema>;

const NewsArticleSchema = z.object({
  title: z.string().describe('The title of the news article.'),
  summary: z.string().describe('A brief summary of the news article.'),
  url: z.string().url().describe('The URL of the news article.'),
});

const RelatedNewsDataSchema = z.array(NewsArticleSchema).describe('A list of related news articles.');
export type RelatedNewsData = z.infer<typeof RelatedNewsDataSchema>;

export async function getNaverNewsAction(input: NaverNewsInput): Promise<RelatedNewsData> {
    const functionUrl = '/api/getNaverNews';
  
    try {
      const host = headers().get('host');
      const protocol = host?.startsWith('localhost') ? 'http' : 'https';
      const baseURL = `${protocol}://${host}`;

      const response = await axios.get(functionUrl, {
        baseURL,
        params: {
          query: input.keyword,
        },
      });

      // Validate the response data with Zod
      const validationResult = RelatedNewsDataSchema.safeParse(response.data);
      if (!validationResult.success) {
        console.error('Naver news data validation failed:', validationResult.error);
        return [];
      }

      return validationResult.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
          console.error('Error fetching Naver news from Cloud Function:', error.response?.data || error.message);
      } else {
          console.error('An unexpected error occurred in getNaverNews:', error);
      }
      return [];
    }
}


export async function getRegionalTrendsAction(input: RegionalTrendsInput): Promise<RegionalTrendsOutput> {
    try {
        const trends = await getRegionalTrends(input);
        return trends;
    } catch (error) {
        console.error('Error fetching regional trends:', error);
        return { relatedKeywords: [], relatedVideos: [] };
    }
}

export async function getKeywordRegionRankAction(input: KeywordRegionRankInput): Promise<KeywordRegionRankOutput> {
    try {
        const rank = await getKeywordRegionRank(input);
        return rank;
    } catch (error) {
        console.error('Error fetching keyword region rank:', error);
        return {};
    }
}
