
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
import type { RelatedNewsData } from '@/ai/flows/naver-news-flow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const recommendedKeywords = ['게임', '먹방', '여행', '뷰티', 'IT'];

type TrendData = {
  [keyword: string]: KeywordTrendPoint[];
};

type NewsData = {
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
  const [newsData, setNewsData] = useState<NewsData>({});
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
      
      const newsPromises = recommendedKeywords.map(keyword =>
        getNaverNewsAction({ keyword }).catch(e => {
            console.error(`Failed to fetch news for ${keyword}`, e);
            return [];
        })
      );

      const [trendResults, newsResults] = await Promise.all([
        Promise.all(trendPromises),
        Promise.all(newsPromises),
      ]);

      const allTrendData: TrendData = {};
      const allNewsData: NewsData = {};

      recommendedKeywords.forEach((keyword, index) => {
        allTrendData[keyword] = trendResults[index];
        allNewsData[keyword] = newsResults[index];
      });

      setTrendData(allTrendData);
      setNewsData(allNewsData);
      setIsLoadingTrends(false);
      setIsLoadingNews(false);
    };
    fetchAllData();
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
            {isLoadingNews ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-5/6" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : newsData[currentKeyword] && newsData[currentKeyword].length > 0 ? (
                 <div className="flex flex-col gap-4">
                    {newsData[currentKeyword].map((article, index) => (
                      <a href={article.url} key={index} target="_blank" rel="noopener noreferrer" className="block">
                        <Card className="transition-shadow hover:shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg">{article.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{article.summary}</p>
                            </CardContent>
                        </Card>
                      </a>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">관련 뉴스를 찾을 수 없습니다.</p>
                </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
