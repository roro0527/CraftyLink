
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import UrlInputSection from '@/components/app/url-input-section';
import RecommendedKeywords from '@/components/app/recommended-keywords';
import HomeTrendChart from '@/components/app/home-trend-chart';
import { useRouter } from 'next/navigation';
import { getKeywordTrendsAction, getRelatedKeywordsAction, RelatedKeywordsData } from '@/app/actions';
import type { KeywordTrendPoint } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const recommendedKeywords = ['게임', '먹방', '여행', '뷰티', 'IT'];

type TrendData = {
  [keyword: string]: KeywordTrendPoint[];
};

type RelatedKeywordsMap = {
  [keyword: string]: RelatedKeywordsData;
};

export default function Home() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [trendData, setTrendData] = useState<TrendData>({});
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);
  const [relatedKeywords, setRelatedKeywords] = useState<RelatedKeywordsMap>({});
  const [isLoadingRelated, setIsLoadingRelated] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoadingTrends(true);
      setIsLoadingRelated(true);

      const trendPromises = recommendedKeywords.map(keyword => 
        getKeywordTrendsAction({ keyword, timeRange: '2w' }).catch(e => {
          console.error(`Failed to fetch trends for ${keyword}`, e);
          return []; // Return empty array on error
        })
      );
      
      const relatedKeywordsPromises = recommendedKeywords.map(keyword =>
        getRelatedKeywordsAction({ keyword }).catch(e => {
            console.error(`Failed to fetch related keywords for ${keyword}`, e);
            return [];
        })
      );

      const [trendResults, relatedKeywordsResults] = await Promise.all([
        Promise.all(trendPromises),
        Promise.all(relatedKeywordsPromises),
      ]);

      const allTrendData: TrendData = {};
      const allRelatedKeywords: RelatedKeywordsMap = {};

      recommendedKeywords.forEach((keyword, index) => {
        allTrendData[keyword] = trendResults[index];
        allRelatedKeywords[keyword] = relatedKeywordsResults[index];
      });

      setTrendData(allTrendData);
      setRelatedKeywords(allRelatedKeywords);
      setIsLoadingTrends(false);
      setIsLoadingRelated(false);
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
            <Card>
              <CardHeader>
                <CardTitle>연관 태그</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingRelated ? (
                   <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-4/5" />
                      <Skeleton className="h-8 w-full" />
                   </div>
                ) : relatedKeywords[currentKeyword] && relatedKeywords[currentKeyword].length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {relatedKeywords[currentKeyword].map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-base">
                            {tag}
                        </Badge>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">관련 태그를 찾을 수 없습니다.</p>
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
