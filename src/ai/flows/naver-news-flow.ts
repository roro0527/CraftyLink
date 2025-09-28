
'use server';
/**
 * @fileOverview Genkit 플로우를 사용하여 Naver News API로부터 관련 뉴스를 가져오는 에이전트입니다.
 *
 * - getNaverNews: 특정 키워드와 관련된 뉴스 기사를 조회하는 공개 함수입니다.
 * - NaverNewsInput: getNaverNews 함수의 입력 타입입니다.
 * - RelatedNewsData: getNaverNews 함수의 반환 타입입니다.
 */

import { z } from 'zod';
import axios from 'axios';
import { ai } from '@/ai/genkit';

// 입력 스키마 정의: 'keyword' 문자열을 필드로 가집니다.
const NaverNewsInputSchema = z.object({
  keyword: z.string().describe('The keyword to find news articles for.'),
});
export type NaverNewsInput = z.infer<typeof NaverNewsInputSchema>;

// 개별 뉴스 기사의 스키마를 정의합니다.
const NewsArticleSchema = z.object({
  title: z.string().describe('The title of the news article.'),
  summary: z.string().describe('A brief summary of the news article.'),
  url: z.string().url().describe('The URL of the news article.'),
});

// 출력 스키마 정의: 뉴스 기사 스키마의 배열입니다.
const RelatedNewsDataSchema = z.array(NewsArticleSchema).describe('A list of related news articles.');
export type RelatedNewsData = z.infer<typeof RelatedNewsDataSchema>;

/**
 * 문자열에서 HTML 태그를 제거하는 유틸리티 함수입니다.
 * @param str HTML 태그를 포함할 수 있는 문자열
 * @returns HTML 태ag가 제거된 문자열
 */
const removeHtmlTags = (str: string) => str ? str.replace(/<[^>]*>?/gm, '') : '';

/**
 * Naver News API를 호출하여 관련 뉴스 기사를 가져오는 핵심 Genkit 플로우입니다.
 */
export const getNaverNewsFlow = ai.defineFlow({
    name: 'getNaverNewsFlow',
    inputSchema: NaverNewsInputSchema,
    outputSchema: RelatedNewsDataSchema
}, async (input) => {
    try {
        console.log(`Fetching Naver news for keyword: ${input.keyword}`);
        const { keyword } = input;
        const naverClientId = process.env.NAVER_CLIENT_ID;
        const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

        if (!keyword) {
            throw new Error("Missing required parameter: keyword");
        }
        if (!naverClientId || !naverClientSecret) {
            console.error("Naver API credentials are not provided in environment variables.");
            throw new Error("Naver API credentials are not provided.");
        }

        const url = "https://openapi.naver.com/v1/search/news.json";

        // axios를 사용하여 서버 측에서 API를 호출합니다.
        const response = await axios.get(url, {
            params: { query: keyword, display: 5, sort: 'sim' }, // 관련도순으로 5개 기사 요청
            headers: {
                "X-Naver-Client-Id": naverClientId,
                "X-Naver-Client-Secret": naverClientSecret,
            },
        });

        // API 응답에 에러 메시지가 포함된 경우 처리합니다.
        if (response.data && response.data.errorMessage) {
            console.error("Naver API returned an error:", response.data.errorMessage, { keyword });
            throw new Error(`Naver API Error: ${response.data.errorMessage}`);
        }

        let articles: RelatedNewsData = [];
        if (response.data && response.data.items) {
            // API 응답을 NewsArticleSchema에 맞게 매핑하고 HTML 태그를 제거합니다.
            articles = response.data.items.map((item: any) => ({
                title: removeHtmlTags(item.title),
                url: item.originallink,
                summary: removeHtmlTags(item.description),
            }));
        }

        // Zod를 사용하여 데이터의 유효성을 검사합니다.
        const validationResult = RelatedNewsDataSchema.safeParse(articles);

        if (!validationResult.success) {
            console.error('Naver news data validation failed:', validationResult.error);
            throw new Error('Naver news data validation failed.');
        }

        return validationResult.data;

    } catch (error: any) {
        console.error(`An unexpected error occurred in getNaverNews for keyword '${input.keyword}':`, error);
        if (axios.isAxiosError(error) && error.response) {
            console.error(`Naver API call failed:`, {
                status: error.response.status,
                data: error.response.data,
            });
        }
        // 클라이언트에 민감한 정보가 노출되지 않도록 일반적인 에러 메시지를 던집니다.
        throw new Error(`Failed to get news for ${input.keyword}. Please check server logs for details.`);
    }
});

/**
 * 클라이언트(서버 액션)에서 호출할 공개 함수입니다.
 * 내부적으로 getNaverNewsFlow를 실행합니다.
 * @param input 검색할 키워드를 포함하는 객체
 * @returns 관련 뉴스 기사 데이터 배열
 */
export async function getNaverNews(input: NaverNewsInput): Promise<RelatedNewsData> {
  return await getNaverNewsFlow(input);
}
