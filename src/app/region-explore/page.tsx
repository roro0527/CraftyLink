
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getRegionalTrendsAction, getYoutubeVideosAction } from '@/app/actions';
import type { RegionalTrendsData } from '@/ai/flows/regional-trends-flow';
import type { YoutubeVideo } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

const RegionMap = dynamic(() => import('@/components/app/region-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[70vh]" />,
});

interface TrendResult {
  keywords: RegionalTrendsData;
  videos: YoutubeVideo[];
}

export default function RegionExplorePage() {
  const [selectedRegion, setSelectedRegion] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [trendResult, setTrendResult] = React.useState<TrendResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [initialCenter] = React.useState<[number, number]>([36.3, 127.8]);
  const [initialZoom] = React.useState(6.25);

  const handleRegionClick = React.useCallback(async (regionName: string, regionCode: string) => {
    setSelectedRegion(regionName);
    setIsLoading(true);
    setError(null);
    setTrendResult(null);

    try {
      const trendingKeywords = await getRegionalTrendsAction({ geoCode: regionCode });
      
      let videoPromises: Promise<YoutubeVideo[]>;

      if (trendingKeywords.length > 0) {
        // 트렌드 키워드가 있으면, 첫 번째 키워드로 영상을 검색
        videoPromises = getYoutubeVideosAction({ keyword: trendingKeywords[0] });
      } else {
        // 트렌드 키워드가 없으면, 지역 이름으로 영상을 검색
        videoPromises = getYoutubeVideosAction({ keyword: regionName });
      }
      
      const videos = await videoPromises;

      setTrendResult({
        keywords: trendingKeywords,
        videos: videos.slice(0, 3), // 최대 3개의 영상만 표시
      });

    } catch (e) {
      console.error(`Error fetching data for ${regionName}:`, e);
      setError(`'${regionName}' 지역의 트렌드 데이터를 불러올 수 없습니다. 다른 지역을 시도해 보세요.`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col md:flex-row">
      <div className="flex-grow p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-4">지역별 트렌드 탐색</h1>
        <Card className="flex-grow bg-muted/30 min-h-[70vh]">
          <CardContent className="p-0 h-full">
            <RegionMap center={initialCenter} zoom={initialZoom} onRegionClick={handleRegionClick} />
          </CardContent>
        </Card>
      </div>
      
      <aside className="w-full md:w-96 p-6 space-y-6">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {selectedRegion ? `${selectedRegion} 트렌드` : '지역별 트렌드'}
            </CardTitle>
            <CardDescription>
                {selectedRegion ? '인기 검색어와 관련 영상입니다.' : '지도에서 지역을 클릭하여 인기 검색어와 관련 영상을 확인하세요.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">인기 검색어</h3>
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">관련 영상</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-1/3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : error ? (
                <div className="text-center py-10">
                    <p className="text-destructive">{error}</p>
                </div>
            ) : trendResult ? (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">인기 검색어</h3>
                  <div className="flex flex-wrap gap-2">
                    {trendResult.keywords.length > 0 ? trendResult.keywords.map(keyword => (
                      <Badge key={keyword} variant="secondary" className="text-sm">{keyword}</Badge>
                    )) : (
                       <p className="text-sm text-muted-foreground">인기 검색어가 없습니다.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">관련 영상</h3>
                  <div className="space-y-4">
                    {trendResult.videos.length > 0 ? trendResult.videos.map((video, index) => (
                      <div key={index} className="flex gap-3 items-start">
                         <div className="text-lg font-bold text-muted-foreground w-6 text-center">{index + 1}</div>
                         <div className="flex-1">
                           <p className="font-semibold text-sm leading-tight line-clamp-2">{video.title}</p>
                           <p className="text-xs text-muted-foreground mt-1">{video.channelTitle} · {format(parseISO(video.publishedAt), 'yyyy.MM.dd')}</p>
                         </div>
                      </div>
                    )) : (
                        <p className="text-sm text-muted-foreground">관련 영상을 찾을 수 없습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10">
                  <p className="text-muted-foreground">지도에서 지역을 선택해주세요.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
