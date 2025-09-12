
'use client';

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

const recommendedKeywords = ['게임', '먹방', '여행', '뷰티', 'IT'];

type TrendData = {
  [keyword: string]: KeywordTrendPoint[];
};

type RelatedNewsMap = {
  [keyword: string]: RelatedNewsData;
};

export default function Home() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [trendData, setTrendData] = useState<TrendData>({});
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);
  const [relatedNews, setRelatedNews] = useState<RelatedNewsMap>({});
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoadingTrends(true);
      setIsLoadingNews(true);

      const trendPromises = recommendedKeywords.map(keyword => 
        getKeywordTrendsAction({ keyword, timeRange: '2w' }).catch(e => {
          console.error(`Failed to fetch trends for ${keyword}`, e);
          return []; // Return empty array on error
        })
      );
      
      const newsPromises = recommendedKeywords.map(async (keyword) => {
        try {
          return await getNaverNewsAction({ keyword });
        } catch (e) { {
            console.error(`Failed to fetch news for ${keyword}`, e);
            toast({
                variant: 'destructive',
                title: '뉴스 데이터 로드 실패',
                description: `'${keyword}' 관련 뉴스를 불러오는 데 실패했습니다.`,
            });
            return []; // Return empty array on error
          }
        }
      });

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
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % recommendedKeywords.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const currentKeyword = recommendedKeywords[activeIndex];

  useEffect(() => {
    setSearchInput(currentKeyword);
  }, [currentKeyword]);

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
  
  return (
    <>
      <main className="flex-grow flex flex-col items-center px-4 py-8">
        <div className="w-full">
          <div className="bg-muted rounded-2xl flex flex-col items-center justify-center p-8 md:p-12">
            <div className="w-full max-w-2xl">
               <UrlInputSection
                urlsInput={searchInput}
                onUrlsInputChange={setSearchInput}
                onSearch={handleSearch}
                isSearching={isSearching}
              />
            </div>
            <div className="w-full mt-8 h-60">
              <HomeTrendChart 
                data={trendData[currentKeyword]} 
                isLoading={isLoadingTrends}
              />
            </div>
          </div>
        </div>
        
        <div className="w-full max-w-4xl mt-6 flex flex-col items-center">
          <RecommendedKeywords 
            keywords={recommendedKeywords}
            activeIndex={activeIndex}
            onKeywordClick={setActiveIndex}
          />

          <div className="w-full mt-6">
            <Card>
              <CardHeader>
                <CardTitle>관련 뉴스</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingNews ? (
                   <div className="space-y-4">
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-20 w-full" />
                   </div>
                ) : relatedNews[currentKeyword] && relatedNews[currentKeyword].length > 0 ? (
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
