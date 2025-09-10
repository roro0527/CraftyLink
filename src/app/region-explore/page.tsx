
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoaderCircle, Search, Video, Trophy } from 'lucide-react';
import { getYoutubeVideosAction, getKeywordRegionRankAction } from '../actions';
import type { YoutubeVideo } from '@/lib/types';
import type { KeywordRegionRankOutput } from '@/ai/flows/keyword-region-rank-flow';
import { format, parseISO } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import regionData from '@/lib/korea-regions.geo.json';

const RegionMap = dynamic(() => import('@/components/app/region-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

declare global {
  interface Window {
    kakao: any;
  }
}

export default function RegionExplorePage() {
  const initialCenter: [number, number] = [36.3, 127.8]; // Center of South Korea
  const initialZoom = 13;

  const [keyword, setKeyword] = React.useState('');
  const [videos, setVideos] = React.useState<YoutubeVideo[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [topRegion, setTopRegion] = React.useState<KeywordRegionRankOutput | null>(null);
  const [bounds, setBounds] = React.useState<any>(null);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setIsSearching(true);
    setVideos([]);
    setTopRegion(null);
    setBounds(null);

    try {
      const [videoResults, regionResult] = await Promise.all([
        getYoutubeVideosAction({ keyword }),
        getKeywordRegionRankAction({ keyword }),
      ]);
      setVideos(videoResults);
      setTopRegion(regionResult);

      if (regionResult?.geoCode) {
        const feature = regionData.features.find(f => f.properties.code === regionResult.geoCode);
        if (feature) {
          const coordinates = feature.geometry.coordinates;
          const newBounds = new window.kakao.maps.LatLngBounds();

          const processCoordinates = (coords: any[]) => {
            coords.forEach((coord: any) => {
              if (Array.isArray(coord[0])) { // Nested arrays for MultiPolygon or holes
                processCoordinates(coord);
              } else {
                newBounds.extend(new window.kakao.maps.LatLng(coord[1], coord[0]));
              }
            });
          };
          
          processCoordinates(coordinates);
          setBounds(newBounds);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // You can add a toast notification here to inform the user.
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-128px)] flex flex-row gap-6">
      <div className="flex-1 h-full rounded-2xl overflow-hidden shadow-lg border relative">
        <RegionMap center={initialCenter} zoom={initialZoom} highlightedRegionCode={topRegion?.geoCode} bounds={bounds} />
      </div>

      <div className="w-96 flex-shrink-0 h-full">
          <Card className="h-full flex flex-col">
            <CardHeader>
            <CardTitle>키워드 탐색</CardTitle>
            <div className="flex w-full items-center space-x-2 pt-2">
                <Input
                type="text"
                placeholder="키워드 입력..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSearching}
                />
                <Button onClick={handleSearch} disabled={isSearching || !keyword.trim()}>
                {isSearching ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                    <Search className="h-4 w-4" />
                )}
                </Button>
            </div>
            </CardHeader>
            
            <CardContent>
              {isSearching ? (
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ) : topRegion?.geoName ? (
                <div className="p-4 border rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">최고 관심 지역</p>
                      <p className="text-lg font-bold">{topRegion.geoName}</p>
                    </div>
                     <div className="ml-auto text-right">
                       <p className="text-sm text-muted-foreground">관심도</p>
                       <p className="text-lg font-bold">{topRegion.value}</p>
                     </div>
                  </div>
                </div>
              ) : (
                 !isSearching && <div className="h-20" />
              )}
            </CardContent>

            <CardContent className="flex-grow overflow-hidden pt-0">
              <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                  {isSearching ? (
                      Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start space-x-4 p-2">
                          <Skeleton className="h-16 w-28 rounded-md" />
                          <div className="space-y-2 flex-1">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                          </div>
                      </div>
                      ))
                  ) : videos.length > 0 ? (
                      videos.map((video, index) => (
                      <div key={index} className="p-2 rounded-lg hover:bg-accent">
                          <p className="font-semibold text-sm line-clamp-2">{video.title}</p>
                          <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                          <span>조회수 {parseInt(video.viewCount, 10).toLocaleString()}회</span>
                          <span>{format(parseISO(video.publishedAt), 'yyyy.MM.dd')}</span>
                          </div>
                      </div>
                      ))
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-10">
                      <Video className="h-12 w-12 mb-4" />
                      <p className="font-semibold">검색 결과가 없습니다.</p>
                      <p className="text-sm">키워드를 검색하여 관련 영상을 찾아보세요.</p>
                      </div>
                  )}
                  </div>
              </ScrollArea>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
