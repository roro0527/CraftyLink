
'use client';

import * as React from 'react';
import RegionMap from '@/components/app/region-map';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart, Compass, Frown, Youtube } from 'lucide-react';
import { getRegionalDashboardAction } from '../actions';
import Image from 'next/image';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { RegionalDashboardOutput } from '@/ai/flows/regional-dashboard-flow';


const chartConfig = {
  value: {
    label: "검색량",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig


export default function RegionTrendsPage() {
  const [selectedRegion, setSelectedRegion] = React.useState<{ code: string; name:string; } | null>(null);
  const [dashboardData, setDashboardData] = React.useState<RegionalDashboardOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const country = {
    code: 'KR',
    name: '한국'
  }

  const handleRegionSelect = async (region: { code: string; name: string }) => {
    setSelectedRegion(region);
    setIsLoading(true);
    setError(null);
    setDashboardData(null);

    try {
        const dashboardResult = await getRegionalDashboardAction({ 
            region: region.name, 
            countryCode: country.code, 
            countryName: country.name 
        });
        setDashboardData(dashboardResult);
    } catch (e) {
      console.error('Failed to fetch regional data:', e);
      setError('지역 트렌드 데이터를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleKeywordClick = (keyword: string) => {
    window.open(`/keyword?q=${encodeURIComponent(keyword)}`, '_blank');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader><Skeleton className="h-7 w-1/3" /></CardHeader>
            <CardContent><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-5/6 mt-2" /></CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
                <CardContent><Skeleton className="h-40 w-full" /></CardContent>
              </Card>
               <Card>
                <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
                </CardContent>
              </Card>
          </div>
          <Card>
             <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
             <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({length: 6}).map((_, i) => (
                    <div key={i}>
                        <Skeleton className="aspect-video w-full" />
                        <Skeleton className="h-5 w-5/6 mt-2" />
                        <Skeleton className="h-4 w-1/2 mt-1" />
                    </div>
                ))}
             </CardContent>
          </Card>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
            <Frown className="h-4 w-4" />
            <AlertTitle>오류 발생</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )
    }

    if (!selectedRegion) {
      return (
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center justify-center">
            <Compass size={48} className="mb-4" />
            <p className="text-lg">지도에서 지역을 선택하여 트렌드를 확인해보세요.</p>
        </div>
      );
    }

    if (!dashboardData) {
         return (
             <div className="text-center py-20 text-muted-foreground">데이터가 없습니다.</div>
         )
    }

    return (
       <div className="space-y-6">
        <Card className="bg-gradient-to-r from-primary/10 to-transparent">
            <CardHeader>
                <CardTitle className="text-2xl">
                    {selectedRegion.name}의 현재 트렌드: <span className="text-primary cursor-pointer hover:underline" onClick={() => handleKeywordClick(dashboardData.topKeyword)}>{dashboardData.topKeyword}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{dashboardData.summary}</p>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5"/>'"{dashboardData.topKeyword}"' 검색 트렌드</CardTitle>
                </CardHeader>
                <CardContent>
                    {dashboardData.trendData && dashboardData.trendData.length > 0 ? (
                        <div className="h-40">
                             <ChartContainer config={chartConfig} className="w-full h-full">
                                <RechartsBarChart data={dashboardData.trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                                </RechartsBarChart>
                            </ChartContainer>
                        </div>
                    ): <p className="text-muted-foreground text-sm">트렌드 데이터가 없습니다.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>관련 뉴스</CardTitle>
                </CardHeader>
                <CardContent>
                     {dashboardData.naverNews && dashboardData.naverNews.length > 0 ? (
                        <ul className="space-y-2">
                        {dashboardData.naverNews.slice(0, 3).map((news: any) => (
                           <li key={news.url}>
                             <a href={news.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline text-muted-foreground line-clamp-2">{news.title}</a>
                           </li>
                        ))}
                        </ul>
                    ) : <p className="text-muted-foreground text-sm">관련 뉴스가 없습니다.</p>}
                </CardContent>
            </Card>
        </div>
        
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Youtube className="h-6 w-6 text-red-600" />관련 영상</CardTitle>
            </CardHeader>
            <CardContent>
                 {dashboardData.youtubeVideos && dashboardData.youtubeVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {dashboardData.youtubeVideos.slice(0, 6).map((video: any) => (
                            <a key={video.id} href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="group">
                                <div className="aspect-video overflow-hidden rounded-lg border">
                                    <Image
                                        src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`}
                                        alt={video.title}
                                        width={320}
                                        height={180}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                </div>
                                <h3 className="font-semibold mt-2 text-sm line-clamp-2 group-hover:text-primary">{video.title}</h3>
                                <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                            </a>
                        ))}
                    </div>
                ) : <p className="text-muted-foreground text-sm">관련 영상이 없습니다.</p>}
            </CardContent>
        </Card>
       </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">지역별 트렌드</h1>
        <p className="text-muted-foreground mt-1">지도를 클릭하여 대한민국의 지역별 실시간 트렌드를 확인해보세요.</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 rounded-2xl border overflow-hidden h-[400px] lg:h-auto min-h-[400px] lg:min-h-0">
          <RegionMap onRegionSelect={handleRegionSelect} selectedRegionCode={selectedRegion?.code} />
        </div>
        <div className="lg:col-span-2">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
