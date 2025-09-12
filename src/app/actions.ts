
'use server';

import type { SuperParam } from '@/lib/types';
import { getKeywordTrends, type KeywordTrendsInput, type KeywordTrendsData } from '@/ai/flows/keyword-trends-flow';
import { getRelatedKeywords, type RelatedKeywordsInput, type RelatedKeywordsData } from '@/ai/flows/related-keywords-flow';
import { getYoutubeVideos, type YoutubeVideosInput, type YoutubeVideosData } from '@/ai/flows/youtube-videos-flow';
import { getRegionalTrends, type RegionalTrendsInput, type RegionalTrendsOutput } from '@/ai/flows/regional-trends-flow';
import { getKeywordRegionRank, type KeywordRegionRankInput, type KeywordRegionRankOutput } from '@/ai/flows/keyword-region-rank-flow';
import { getNaverNews, type NaverNewsInput, type RelatedNewsData } from '@/ai/flows/naver-news-flow';
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

export async function getNaverNewsAction(input: NaverNewsInput): Promise<RelatedNewsData> {
    try {
        const news = await getNaverNews(input);
        return news;
    } catch (error) {
        console.error('Error fetching naver news:', error);
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
