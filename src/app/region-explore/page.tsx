
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Search } from 'lucide-react';
import type { YoutubeVideo } from '@/lib/types';
import { getRegionalTrendsAction } from '@/app/actions';
import type { RegionalTrendsOutput } from '@/ai/flows/regional-trends-flow';

const RegionMap = dynamic(() => import('@/components/app/region-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

const regionNameMap: { [key: string]: string } = {
    "서울특별시": "서울",
    "부산광역시": "부산",
    "대구광역시": "대구",
    "인천광역시": "인천",
    "광주광역시": "광주",
    "대전광역시": "대전",
    "울산광역시": "울산",
    "세종특별자치시": "세종",
    "경기도": "경기",
    "강원특별자치도": "강원",
    "충청북도": "충북",
    "충청남도": "충남",
    "전북특별자치도": "전북",
    "전라남도": "전남",
    "경상북도": "경북",
    "경상남도": "경남",
    "제주특별자치도": "제주",
};

export default function RegionExplorePage() {
  const initialCenter: [number, number] = [36.5, 127.5]; 
  const initialZoom = 7;

  const [selectedRegionCode, setSelectedRegionCode] = React.useState<string | null>('KR-11');
  const [selectedRegionName, setSelectedRegionName] = React.useState<string | null>('서울특별시');
  const [keyword, setKeyword] = React.useState('K-POP');
  const [trendData, setTrendData] = React.useState<RegionalTrendsOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchRegionalData = async (regionCode: string, regionName: string, query: string) => {
    if (!regionCode || !query) return;
    setIsLoading(true);
    try {
        const data = await getRegionalTrendsAction({ keyword: query, region: regionCode });
        setTrendData(data);
        setSelectedRegionCode(regionCode);
        setSelectedRegionName(regionName);
    } catch (error) {
        console.error("Failed to fetch regional trends", error);
        setTrendData({ relatedKeywords: [], relatedVideos: [] });
    } finally {
        setIsLoading(false);
    }
  };

  React.useEffect(() => {
    // Load initial data for Seoul
    fetchRegionalData('KR-11', '서울특별시', 'K-POP');
  }, []);

  const handleRegionSelect = (code: string, name: string) => {
    fetchRegionalData(code, name, keyword);
  };
  
  const handleSearch = () => {
    if(selectedRegionCode && selectedRegionName) {
      fetchRegionalData(selectedRegionCode, selectedRegionName, keyword);
    }
  };

  const handleKeywordKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };
  
  const formatViewCount = (count: string) => {
    const number = parseInt(count, 10);
    if (number >= 10000) {
      return `${Math.floor(number / 10000)}만회`;
    }
    if (number >= 1000) {
        return `${(number / 1000).toFixed(1)}천회`;
    }
    return `${number}회`;
  };


  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      <main className="flex-1 h-full relative">
        <RegionMap 
          center={initialCenter} 
          zoom={initialZoom} 
          onRegionSelect={handleRegionSelect}
          selectedRegionName={selectedRegionName}
        />
      </main>
      <aside className="w-[380px] h-full border-l bg-card p-4 overflow-y-auto">
        <div className="flex flex-col h-full">
          <div>
            <h2 className="text-2xl font-bold">
              {selectedRegionName ? regionNameMap[selectedRegionName] || selectedRegionName : "지역을 선택하세요"}
            </h2>
            <p className="text-muted-foreground mb-4">지역별 트렌드를 확인해보세요.</p>
            <div className="relative mb-4">
              <Input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="키워드 입력..."
                className="pr-10"
                disabled={isLoading}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleSearch}
                disabled={isLoading || !keyword}
              >
                {isLoading ? <LoaderCircle className="h-5 w-5 animate-spin"/> : <Search className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="space-y-6 mt-4">
              <div>
                <Skeleton className="h-6 w-32 mb-3" />
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-16" />
                </div>
              </div>
               <div>
                <Skeleton className="h-6 w-40 mb-3" />
                <div className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>
          ) : trendData ? (
             <div className="flex-1 overflow-y-auto space-y-6 mt-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">연관 검색어</h3>
                   {trendData.relatedKeywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {trendData.relatedKeywords.map((kw, i) => <Badge key={i} variant="secondary">{kw}</Badge>)}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">관련 영상</h3>
                  {trendData.relatedVideos.length > 0 ? (
                    <div className="space-y-3">
                      {(trendData.relatedVideos as YoutubeVideo[]).slice(0, 3).map((video, i) => (
                          <Card key={i} className="text-sm">
                            <CardContent className="p-3">
                              <p className="font-semibold line-clamp-2 mb-1">{video.title}</p>
                              <div className="flex justify-between text-muted-foreground text-xs">
                                <span>{video.channelTitle}</span>
                                <span>조회수 {formatViewCount(video.viewCount)}</span>
                              </div>
                            </CardContent>
                          </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
                  )}
                </div>
             </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">데이터를 불러오는 중 오류가 발생했습니다.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
