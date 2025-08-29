
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import UrlInputSection from '@/components/app/url-input-section';
import RecommendedKeywords from '@/components/app/recommended-keywords';
import HomeTrendChart from '@/components/app/home-trend-chart';
import { useRouter } from 'next/navigation';
import { getKeywordTrendsAction } from '@/app/actions';
import type { KeywordTrendPoint } from '@/lib/types';

const recommendedKeywords = ['게임', '먹방', '여행', '뷰티', 'IT'];

type TrendData = {
  [keyword: string]: KeywordTrendPoint[];
};

export default function Home() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [trendData, setTrendData] = useState<TrendData>({});
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);

  useEffect(() => {
    const fetchAllTrends = async () => {
      setIsLoadingTrends(true);
      const allTrendData: TrendData = {};
      await Promise.all(
        recommendedKeywords.map(async (keyword) => {
          try {
            const trends = await getKeywordTrendsAction({ keyword, timeRange: '2w' });
            allTrendData[keyword] = trends;
          } catch (error) {
            console.error(`Failed to fetch trends for ${keyword}`, error);
            allTrendData[keyword] = []; // Set empty array on error
          }
        })
      );
      setTrendData(allTrendData);
      setIsLoadingTrends(false);
    };
    fetchAllTrends();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % recommendedKeywords.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSearchInput(recommendedKeywords[activeIndex]);
  }, [activeIndex]);

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
                data={trendData[recommendedKeywords[activeIndex]]} 
                isLoading={isLoadingTrends}
              />
            </div>
          </div>
        </div>
        
        <div className="w-full max-w-2xl mt-6 flex flex-col items-center">
          <RecommendedKeywords 
            keywords={recommendedKeywords}
            activeIndex={activeIndex}
            onKeywordClick={setActiveIndex}
          />
        </div>

      </main>
    </>
  );
}
