
'use server';

import type { SuperParam } from '@/lib/types';
import {nanoid} from 'nanoid';
import { getKeywordTrends, type KeywordTrendsInput, type KeywordTrendsData } from '@/ai/flows/keyword-trends-flow';
import { getRelatedKeywords, type RelatedKeywordsInput, type RelatedKeywordsData } from '@/ai/flows/related-keywords-flow';
import { getYoutubeVideos, type YoutubeVideosInput, type YoutubeVideosData } from '@/ai/flows/youtube-videos-flow';
import { getRelatedNews, type RelatedNewsInput, type RelatedNewsData } from '@/ai/flows/related-news-flow';
import { getRegionalTrends, type RegionalTrendsInput, type RegionalTrendsOutput } from '@/ai/flows/regional-trends-flow';


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

export async function getRelatedNewsAction(input: RelatedNewsInput): Promise<RelatedNewsData> {
    try {
        const news = await getRelatedNews(input);
        return news;
    } catch (error) {
        console.error('Error fetching related news:', error);
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
