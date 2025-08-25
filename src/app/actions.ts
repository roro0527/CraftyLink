
'use server';

import type { SuperParam } from '@/lib/types';
import {nanoid} from 'nanoid';
import { getKeywordTrends, type KeywordTrendsInput, type KeywordTrendsData } from '@/ai/flows/keyword-trends-flow';
import { getRelatedKeywords, type RelatedKeywordsInput, type RelatedKeywordsData } from '@/ai/flows/related-keywords-flow';


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
    // You might want to handle this more gracefully
    throw new Error('키워드 트렌드 데이터를 가져오는데 실패했습니다.');
  }
}

export async function getRelatedKeywordsAction(input: RelatedKeywordsInput): Promise<RelatedKeywordsData> {
    try {
        const keywords = await getRelatedKeywords(input);
        return keywords;
    } catch (error) {
        console.error('Error fetching related keywords:', error);
        throw new Error('연관 키워드 데이터를 가져오는데 실패했습니다.');
    }
}
