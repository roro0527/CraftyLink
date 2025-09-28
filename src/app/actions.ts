
'use server';

import type { SuperParam } from '@/lib/types';
import { getKeywordTrends, type KeywordTrendsInput, type KeywordTrendsData } from '@/ai/flows/keyword-trends-flow';
import { getRelatedKeywords } from '@/ai/flows/related-keywords-flow';
import { getYoutubeVideos, type YoutubeVideosInput, type YoutubeVideosData } from '@/ai/flows/youtube-videos-flow';
import { getNaverNews, type NaverNewsInput, type RelatedNewsData } from '@/ai/flows/naver-news-flow';
import { getDictionaryEntry, type DictionaryInput, type DictionaryEntry } from '@/ai/flows/dictionary-flow';
import { getGoogleImages, type GoogleImagesInput, type GoogleImagesData } from '@/ai/flows/google-images-flow';


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
    console.error('Error in getKeywordTrendsAction:', error);
    // Re-throw the error to be handled by the calling component
    throw error;
  }
}


export async function getRelatedKeywordsAction(input: { keyword: string }): Promise<string[]> {
    try {
        const keywords = await getRelatedKeywords(input);
        // Ensure it always returns an array
        return keywords || [];
    } catch (error) {
        console.error('Error in getRelatedKeywordsAction:', error);
        // Return an empty array on failure to prevent app crashes
        return [];
    }
}


export async function getNaverNewsAction(input: NaverNewsInput): Promise<RelatedNewsData> {
    try {
        const news = await getNaverNews(input);
        return news;
    } catch (error) {
        console.error('Error in getNaverNewsAction:', error);
        // Re-throw to be handled by the component
        throw error;
    }
}


export async function getYoutubeVideosAction(input: YoutubeVideosInput): Promise<YoutubeVideosData> {
    try {
        const videos = await getYoutubeVideos(input);
        return videos;
    } catch (error) {
        console.error('Error in getYoutubeVideosAction:', error);
        // Return a default empty state on error
        return { videos: [], nextPageToken: null };
    }
}

export async function getDictionaryEntryAction(input: DictionaryInput): Promise<DictionaryEntry> {
    try {
        const entry = await getDictionaryEntry(input);
        return entry;
    } catch (error) {
        console.error('Error in getDictionaryEntryAction:', error);
        // Re-throw to let the component handle the error state
        throw new Error('Failed to get dictionary entry.');
    }
}

export async function getGoogleImagesAction(input: GoogleImagesInput): Promise<GoogleImagesData> {
    try {
        const images = await getGoogleImages(input);
        return images;
    } catch (error) {
        console.error('Error in getGoogleImagesAction:', error);
        // Re-throw to let the component handle the error state
        throw new Error('Failed to get google images.');
    }
}
