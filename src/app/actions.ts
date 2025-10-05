
'use server';

/**
 * @file 서버 액션 함수들을 정의합니다.
 * 클라이언트 컴포넌트는 이 함수들을 직접 호출하여 서버 사이드 로직(Genkit Flows)을 실행하고 데이터를 받아올 수 있습니다.
 * 이 파일은 클라이언트와 서버 사이의 통신 브릿지 역할을 합니다.
 */

import { getKeywordTrends, type KeywordTrendsInput, type KeywordTrendsData } from '@/ai/flows/keyword-trends-flow';
import { getRelatedKeywords } from '@/ai/flows/related-keywords-flow';
import { getYoutubeVideos, type YoutubeVideosInput, type YoutubeVideosData } from '@/ai/flows/youtube-videos-flow';
import { getNaverNews, type NaverNewsInput, type RelatedNewsData } from '@/ai/flows/naver-news-flow';
import { getDictionaryEntry, type DictionaryInput, type DictionaryEntry } from '@/ai/flows/dictionary-flow';
import { getGoogleImagesFlow, type GoogleImagesInput, type GoogleImagesData } from '@/ai/flows/google-images-flow';


/**
 * 키워드 트렌드 데이터를 가져오는 서버 액션입니다.
 * @param input 키워드와 시간 범위를 포함하는 객체
 * @returns 트렌드 데이터 배열
 */
export async function getKeywordTrendsAction(input: KeywordTrendsInput): Promise<KeywordTrendsData> {
  try {
    const trends = await getKeywordTrends(input);
    return trends;
  } catch (error) {
    console.error('Error in getKeywordTrendsAction:', error);
    // 에러 발생 시 클라이언트 컴포넌트에서 처리할 수 있도록 다시 던집니다.
    throw error;
  }
}

/**
 * 관련 키워드 목록을 가져오는 서버 액션입니다.
 * @param input 키워드를 포함하는 객체
 * @returns 관련 키워드 문자열 배열
 */
export async function getRelatedKeywordsAction(input: { keyword: string }): Promise<string[]> {
    try {
        const keywords = await getRelatedKeywords(input);
        // 항상 배열을 반환하도록 보장합니다.
        return keywords || [];
    } catch (error) {
        console.error('Error in getRelatedKeywordsAction:', error);
        // 실패 시 앱 충돌을 방지하기 위해 빈 배열을 반환합니다.
        return [];
    }
}

/**
 * 네이버 뉴스 기사 목록을 가져오는 서버 액션입니다.
 * @param input 키워드를 포함하는 객체
 * @returns 관련 뉴스 데이터 배열
 */
export async function getNaverNewsAction(input: NaverNewsInput): Promise<RelatedNewsData> {
    try {
        const news = await getNaverNews(input);
        return news;
    } catch (error) {
        console.error('Error in getNaverNewsAction:', error);
        // 에러 발생 시 클라이언트 컴포넌트에서 처리할 수 있도록 다시 던집니다.
        throw error;
    }
}

/**
 * 유튜브 비디오 목록을 가져오는 서버 액션입니다.
 * @param input 키워드와 페이지 토큰을 포함하는 객체
 * @returns 비디오 데이터와 다음 페이지 토큰을 포함하는 객체
 */
export async function getYoutubeVideosAction(input: YoutubeVideosInput): Promise<YoutubeVideosData> {
    try {
        const videos = await getYoutubeVideos(input);
        return videos;
    } catch (error) {
        console.error('Error in getYoutubeVideosAction:', error);
        // 에러 발생 시 앱 충돌을 막기 위해 기본 빈 상태를 반환합니다.
        return { videos: [], nextPageToken: null };
    }
}

/**
 * 사전 정보를 가져오는 서버 액션입니다.
 * @param input 키워드를 포함하는 객체
 * @returns 사전 항목 데이터 객체
 */
export async function getDictionaryEntryAction(input: DictionaryInput): Promise<DictionaryEntry> {
    try {
        const entry = await getDictionaryEntry(input);
        return entry;
    } catch (error) {
        console.error('Error in getDictionaryEntryAction:', error);
        // 클라이언트에서 에러 상태를 처리할 수 있도록 다시 던집니다.
        throw new Error('Failed to get dictionary entry.');
    }
}

/**
 * 구글 이미지 목록을 가져오는 서버 액션입니다.
 * @param input 키워드와 시작 인덱스를 포함하는 객체
 * @returns 이미지 데이터와 다음 페이지 인덱스를 포함하는 객체
 */
export async function getGoogleImagesAction(input: GoogleImagesInput): Promise<GoogleImagesData> {
    try {
        const images = await getGoogleImagesFlow(input);
        return images;
    } catch (error) {
        console.error('Error in getGoogleImagesAction:', error);
        // 클라이언트에서 에러 상태를 처리할 수 있도록 다시 던집니다.
        throw new Error('Failed to get google images.');
    }
}
