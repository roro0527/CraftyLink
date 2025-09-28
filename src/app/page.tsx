
'use client';

/**
 * @file 메인 페이지(홈) 컴포넌트입니다.
 * 추천 키워드를 보여주고, 키워드 검색, 트렌드 차트, 관련 뉴스 기능을 제공합니다.
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import UrlInputSection from '@/components/app/url-input-section';
import RecommendedKeywords from '@/components/app/recommended-keywords';
import HomeTrendChart from '@/components/app/home-trend-chart';
import { useRouter } from 'next/navigation';
import { getKeywordTrendsAction, getNaverNewsAction } from '@/app/actions';
import type { KeywordTrendPoint } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { RelatedNewsData } from '@/ai/flows/naver-news-flow';

// 홈 화면에서 추천할 키워드 목록
const recommendedKeywords = ['게임', '먹방', '여행', '뷰티', 'IT'];

// 데이터 타입 정의
type TrendData = {
  [keyword: string]: KeywordTrendPoint[];
};
type RelatedNewsMap = {
  [keyword: string]: RelatedNewsData;
};

export default function Home() {
  const { toast } = useToast();
  const router = useRouter();

  // --- State 정의 ---
  const [searchInput, setSearchInput] = useState<string>(''); // 검색창의 입력 값
  const [isSearching, setIsSearching] = useState(false); // 검색 실행 중 상태
  const [activeIndex, setActiveIndex] = useState(0); // 현재 활성화된 추천 키워드 인덱스
  const [trendData, setTrendData] = useState<TrendData>({}); // 키워드별 트렌드 데이터
  const [isLoadingTrends, setIsLoadingTrends] = useState(true); // 트렌드 데이터 로딩 상태
  const [relatedNews, setRelatedNews] = useState<RelatedNewsMap>({}); // 키워드별 관련 뉴스 데이터
  const [isLoadingNews, setIsLoadingNews] = useState(true); // 뉴스 데이터 로딩 상태

  /**
   * 페이지 로드 시 모든 추천 키워드에 대한 트렌드와 뉴스 데이터를 병렬로 가져옵니다.
   */
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoadingTrends(true);
      setIsLoadingNews(true);

      // 트렌드 데이터 요청 Promise 배열 생성
      const trendPromises = recommendedKeywords.map(keyword => 
        getKeywordTrendsAction({ keyword, timeRange: '2w' }).catch(e => {
          console.error(`Failed to fetch trends for ${keyword}`, e);
          return []; // 에러 발생 시 빈 배열 반환
        })
      );
      
      // 뉴스 데이터 요청 Promise 배열 생성
      const newsPromises = recommendedKeywords.map(async (keyword) => {
        try {
          return await getNaverNewsAction({ keyword });
        } catch (e) {
            console.error(`Failed to fetch news for ${keyword}`, e);
            toast({
                variant: 'destructive',
                title: '뉴스 데이터 로드 실패',
                description: `'${keyword}' 관련 뉴스를 불러오는 데 실패했습니다.`,
            });
            return []; // 에러 발생 시 빈 배열 반환
        }
      });

      // 모든 요청을 병렬로 실행
      const [trendResults, newsResults] = await Promise.all([
        Promise.all(trendPromises),
        Promise.all(newsPromises),
      ]);

      const allTrendData: TrendData = {};
      const allNewsData: RelatedNewsMap = {};

      recommendedKeywords.forEach((keyword, index) => {
        allTrendData[keyword] = trendResults[index];
        allNewsData[keyword] = newsResults[index];
      });

      setTrendData(allTrendData);
      setRelatedNews(allNewsData);
      setIsLoadingTrends(false);
      setIsLoadingNews(false);
    };
    fetchAllData();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 페이지가 처음 마운트될 때 한 번만 실행

  /**
   * 5초마다 활성화된 추천 키워드 인덱스를 변경하여 자동으로 키워드가 전환되도록 합니다.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % recommendedKeywords.length);
    }, 5000);
    return () => clearInterval(interval); // 컴포넌트 언마운트 시 인터벌 정리
  }, []);
  
  const currentKeyword = recommendedKeywords[activeIndex];

  /**
   * 활성화된 키워드가 변경될 때마다 검색창의 내용을 해당 키워드로 업데이트합니다.
   */
  useEffect(() => {
    setSearchInput(currentKeyword);
  }, [currentKeyword]);

  /**
   * 검색 버튼 클릭 또는 Enter 입력 시 키워드 상세 페이지로 이동하는 핸들러입니다.
   */
  const handleSearch = () => {
    if (!searchInput.trim()) {
       toast({
        variant: 'destructive',
        title: '검색어를 입력하세요',
        description: 'URL을 검색하려면 키워드를 입력해주세요.',
      });
      return;
    }
    setIsSearching(true);
    router.push(`/keyword?q=${encodeURIComponent(searchInput)}`);
  };
  
  // --- JSX 렌더링 ---
  return (
    <>
      <main className="flex-grow flex flex-col items-center px-4 py-8">
        <div className="w-full">
          <div className="bg-muted rounded-2xl flex flex-col items-center justify-center p-8 md:p-12">
            {/* 키워드 검색 입력 섹션 */}
            <div className="w-full max-w-2xl">
               <UrlInputSection
                urlsInput={searchInput}
                onUrlsInputChange={setSearchInput}
                onSearch={handleSearch}
                isSearching={isSearching}
              />
            </div>
            {/* 트렌드 차트 */}
            <div className="w-full mt-8 h-60">
              <HomeTrendChart 
                data={trendData[currentKeyword]} 
                isLoading={isLoadingTrends}
              />
            </div>
          </div>
        </div>
        
        <div className="w-full max-w-4xl mt-6 flex flex-col items-center">
          {/* 추천 키워드 인디케이터 */}
          <RecommendedKeywords 
            keywords={recommendedKeywords}
            activeIndex={activeIndex}
            onKeywordClick={setActiveIndex}
          />

          {/* 관련 뉴스 섹션 */}
          <div className="w-full mt-6">
            <Card>
              <CardHeader>
                <CardTitle>관련 뉴스</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingNews ? (
                  // 로딩 중 스켈레톤 UI
                   <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                   </div>
                ) : relatedNews[currentKeyword] && relatedNews[currentKeyword].length > 0 ? (
                  // 뉴스가 있을 경우
                    <ul className="space-y-4">
                        {relatedNews[currentKeyword].slice(0, 5).map((news, index) => (
                           <li key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                               <a href={news.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                 <h3 className="font-semibold">{news.title}</h3>
                               </a>
                               <p className="text-sm text-muted-foreground mt-1">{news.summary}</p>
                           </li>
                        ))}
                    </ul>
                ) : (
                  // 뉴스가 없을 경우
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">관련된 뉴스를 찾을 수 없습니다.</p>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
