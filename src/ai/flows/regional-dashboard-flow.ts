
'use server';

import { ai } from '@/ai/genkit';
import { getKeywordTrends } from './keyword-trends-flow';
import { getNaverNews } from './naver-news-flow';
import { getYoutubeVideos } from './youtube-videos-flow';
import * as z from 'zod';

const RegionalDashboardInputSchema = z.object({
  region: z.string().describe('The name of the region (e.g., "서울특별시").'),
  countryCode: z.string().describe('The country code for rising searches (e.g., "KR").'),
  countryName: z.string().describe('The display name for the country (e.g., "한국").'),
});

const RegionalDashboardOutputSchema = z.object({
  topKeyword: z.string(),
  summary: z.string(),
  trendData: z.any(),
  naverNews: z.any(),
  youtubeVideos: z.any(),
});

export type RegionalDashboardInput = z.infer<typeof RegionalDashboardInputSchema>;
export type RegionalDashboardOutput = z.infer<typeof RegionalDashboardOutputSchema>;

const topKeywordPrompt = ai.definePrompt({
    name: 'topKeywordPrompt',
    input: { schema: z.object({ region: z.string() }) },
    output: { schema: z.object({ keyword: z.string() }) },
    prompt: `{{region}}에서 최근 가장 인기 있는 검색어 1개를 예상해서 알려줘. 다른 설명 없이 키워드만 정확히 알려줘.`,
});


export const getRegionalDashboard = ai.defineFlow(
  {
    name: 'getRegionalDashboard',
    inputSchema: RegionalDashboardInputSchema,
    outputSchema: RegionalDashboardOutputSchema,
  },
  async ({ region, countryCode, countryName }) => {
    
    const { output: topKeywordOutput } = await topKeywordPrompt({ region });
    const topKeyword = topKeywordOutput?.keyword;

    if (!topKeyword) {
      return {
        topKeyword: 'N/A',
        summary: `${region} 지역의 인기 키워드를 찾을 수 없습니다.`,
        trendData: [],
        naverNews: [],
        youtubeVideos: [],
      };
    }

    const [trendData, naverNewsResult, youtubeVideosResult] = await Promise.all([
      getKeywordTrends({ keyword: topKeyword, timeRange: '1m' }),
      getNaverNews({ keyword: topKeyword }),
      getYoutubeVideos({ keyword: topKeyword }),
    ]);

    const summaryPrompt = `다음 데이터를 바탕으로 ${region} 지역의 현재 트렌드를 1~2문장으로 요약해줘. 가장 인기있는 키워드는 '${topKeyword}'이야. 이 키워드의 검색량 추이, 관련 뉴스, 관련 유튜브 영상 데이터를 참고해서 자연스럽게 설명해줘. 예를 들어, '현재 ${region}에서는 ${topKeyword}에 대한 관심이 뜨겁습니다. 관련 영상과 뉴스가 많이 생성되고 있으며, 검색량도 꾸준히 증가하는 추세입니다.' 와 같이 작성해줘.`;

    const { text: summary } = await ai.generate({
      prompt: summaryPrompt,
    });

    return {
      topKeyword,
      summary,
      trendData,
      naverNews: naverNewsResult,
      youtubeVideos: youtubeVideosResult.videos,
    };
  }
);
