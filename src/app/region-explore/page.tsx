
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getRegionalTrendsAction } from '@/app/actions';
import type { RegionalTrendsOutput } from '@/ai/flows/regional-trends-flow';
import type { YoutubeVideo } from '@/lib/types';

// Dynamically import the map component to avoid SSR issues with Leaflet
const RegionMap = dynamic(() => import('@/components/app/region-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

export default function RegionExplorePage() {
  const [keyword, setKeyword] = React.useState('축구');
  const [selectedRegion, setSelectedRegion] = React.useState<{ name: string; code: string } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [trendData, setTrendData] = React.useState<RegionalTrendsOutput | null>(null);
  
  const initialCenter: [number, number] = [36.3, 127.8];
  const initialZoom = 7.5;

  const handleSearch = async (region: { name: string, code: string } | null = selectedRegion) => {
    if (!keyword.trim() || !region) {
      return;
    }
    setIsLoading(true);
    setTrendData(null);
    const data = await getRegionalTrendsAction({ keyword, region: region.code });
    setTrendData(data);
    setIsLoading(false);
  };

  const handleRegionSelect = (name: string, code: string) => {
    const newRegion = { name, code };
    setSelectedRegion(newRegion);
    handleSearch(newRegion);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Fetch initial data for Seoul on component mount
  React.useEffect(() => {
    const seoul = { name: '서울특별시', code: 'KR-11' };
    setSelectedRegion(seoul);
    handleSearch(seoul);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 h-full min-h-[70vh] rounded-2xl overflow-hidden shadow-sm">
        <RegionMap
          center={initialCenter}
          zoom={initialZoom}
          onRegionSelect={handleRegionSelect}
          selectedRegionName={selectedRegion?.name || ''}
        />
      </div>
      <aside className="space-y-6 sticky top-6 self-start">
        <Card>
          <CardHeader>
            <CardTitle>지역별 트렌드 검색</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="relative">
              <Input
                type="text"
                placeholder="키워드 입력..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pr-12"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSearch()}
                disabled={isLoading || !keyword.trim() || !selectedRegion}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              >
                {isLoading ? <LoaderCircle className="animate-spin" /> : <Search />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>연관 검색어</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-wrap gap-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
              </div>
            ) : trendData?.relatedKeywords && trendData.relatedKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {trendData.relatedKeywords.map((kw) => (
                  <Badge key={kw} variant="secondary">{kw}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>관련 영상</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))
              ) : trendData?.relatedVideos && trendData.relatedVideos.length > 0 ? (
                trendData.relatedVideos.slice(0, 3).map((video: YoutubeVideo, index: number) => (
                  <div key={index} className="flex items-center gap-4">
                    <p className="text-lg font-bold text-muted-foreground">{index + 1}</p>
                    <div>
                      <p className="font-semibold line-clamp-2">{video.title}</p>
                      <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">데이터가 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
