
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { getRegionalTrendsAction, getYoutubeVideosAction } from '../actions';
import type { YoutubeVideo } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const RegionMap = dynamic(() => import('@/components/app/region-map'), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-full" />
});

interface TrendWithVideos {
    keyword: string;
    videos: YoutubeVideo[];
}

export default function RegionExplorePage() {
  const [selectedRegion, setSelectedRegion] = React.useState<{ name: string; code: string } | null>(null);
  const [regionalTrends, setRegionalTrends] = React.useState<TrendWithVideos[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRegionClick = React.useCallback(async (region: { name: string; code: string }) => {
    if (isLoading) return;

    setSelectedRegion(region);
    setIsLoading(true);
    setRegionalTrends([]);

    try {
        const trends = await getRegionalTrendsAction({ geoCode: region.code });

        if (trends.length === 0) {
            setRegionalTrends([]);
            return;
        }

        const trendsWithVideos = await Promise.all(
            trends.slice(0, 3).map(async (keyword) => {
                const videos = await getYoutubeVideosAction({ keyword });
                return {
                    keyword: keyword,
                    videos: videos.slice(0, 2)
                };
            })
        );
        setRegionalTrends(trendsWithVideos);

    } catch (error) {
        console.error("Failed to fetch regional data:", error);
        setRegionalTrends([]);
    } finally {
        setIsLoading(false);
    }
  }, [isLoading]);

  return (
    <div className="flex h-[calc(100vh-65px)]">
      <div className="flex-grow p-6">
        <h1 className="text-2xl font-bold mb-4">지역별 트렌드 탐색</h1>
        <Card className="h-[calc(100%-48px)]">
          <CardContent className="p-0 h-full">
            <RegionMap
                center={[35.9, 127.7]}
                zoom={7}
                onRegionClick={handleRegionClick}
            />
          </CardContent>
        </Card>
      </div>
      
      <aside className="w-96 p-6 space-y-6 overflow-auto bg-muted/30">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
                {selectedRegion ? `${selectedRegion.name} 트렌드` : "지역을 선택하세요"}
            </CardTitle>
            <CardDescription>
                지도에서 지역을 클릭하여 인기 검색어와 관련 영상을 확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
            ) : regionalTrends.length > 0 ? (
                <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                    {regionalTrends.map((trend, index) => (
                        <AccordionItem value={`item-${index}`} key={trend.keyword}>
                            <AccordionTrigger className="text-base font-medium">{index + 1}. {trend.keyword}</AccordionTrigger>
                            <AccordionContent>
                                {trend.videos.length > 0 ? (
                                    <div className="space-y-3">
                                        {trend.videos.map((video) => (
                                            <div key={video.title}>
                                                <p className="font-semibold text-sm truncate">{video.title}</p>
                                                <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">관련 영상을 찾을 수 없습니다.</p>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : selectedRegion && !isLoading ? (
                 <div className="text-center py-10">
                    <p className="text-muted-foreground">이 지역의 트렌드 데이터를 불러올 수 없습니다.</p>
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
