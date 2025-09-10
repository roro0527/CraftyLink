
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, Search, Video, Trophy } from 'lucide-react';
import { getYoutubeVideosAction, getKeywordRegionRankAction } from '../actions';
import type { YoutubeVideo } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import regionsData from '@/lib/korea-regions.geo.json';

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
  const initialCenter: [number, number] = [36.3, 127.8];
  const initialZoom = 13;

  const [keyword, setKeyword] = React.useState('');
  const [videos, setVideos] = React.useState<YoutubeVideo[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [topRegion, setTopRegion] = React.useState<{ geoCode: string; geoName: string; value: number } | null>(null);
  const [bounds, setBounds] = React.useState<any>(null);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setIsSearching(true);
    setVideos([]);
    setTopRegion(null);
    setBounds(null);

    try {
      const [videoResults, regionRankResult] = await Promise.all([
        getYoutubeVideosAction({ keyword }),
        getKeywordRegionRankAction({ keyword }),
      ]);
      
      setVideos(videoResults);

      if (regionRankResult && regionRankResult.geoCode) {
        setTopRegion({
          geoCode: regionRankResult.geoCode,
          geoName: regionRankResult.geoName || '알 수 없음',
          value: regionRankResult.value || 0,
        });

        // Find region geometry and calculate bounds
        const regionFeature = regionsData.features.find(
          (f) => f.properties.code === regionRankResult.geoCode
        );

        if (regionFeature) {
          const coordinates = regionFeature.geometry.coordinates;
          const newBounds = new window.kakao.maps.LatLngBounds();

          const processCoordinates = (coords: any[]) => {
            coords.forEach((coord: any) => {
              if (Array.isArray(coord[0])) { // MultiPolygon or nested Polygon
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
        <RegionMap 
            center={initialCenter} 
            zoom={initialZoom} 
            highlightedRegionCode={topRegion?.geoCode}
            bounds={bounds}
        />
      </div>

      <div className="w-96 flex-shrink-0 h-full flex flex-col gap-6">
          <Card className="flex flex-col">
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
                  {isSearching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
          </Card>
          
          {isSearching || topRegion ? (
              <Card>
                <CardHeader className="flex-row items-center gap-2 space-y-0">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <CardTitle className="text-lg">최고 관심 지역</CardTitle>
                </CardHeader>
                <CardContent>
                    {isSearching ? (
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-2/4" />
                            <Skeleton className="h-4 w-1/4" />
                        </div>
                    ) : topRegion ? (
                        <div>
                            <p className="text-xl font-bold">{topRegion.geoName}</p>
                            <p className="text-sm text-muted-foreground">관심도 점수: {topRegion.value}</p>
                        </div>
                    ) : null}
                </CardContent>
              </Card>
          ) : null}


          <Card className="h-full flex flex-col flex-grow overflow-hidden">
            <CardHeader>
              <CardTitle>관련 영상</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden pt-0">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {isSearching ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-start space-x-4 p-2">
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
