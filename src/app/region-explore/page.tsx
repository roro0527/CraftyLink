
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoaderCircle, MapPin, TrendingUp, Newspaper, Youtube } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getYoutubeVideosAction, getNaverNewsAction } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import RegionMap from '@/components/app/region-map';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { YoutubeVideosData } from '@/ai/flows/youtube-videos-flow';
import type { RelatedNewsData } from '@/ai/flows/naver-news-flow';
import axios from 'axios';
import { getKeywordTrendsAction } from '../actions';
import type { KeywordTrendPoint } from '@/lib/types';


const chartConfig = {
  value: {
    label: '검색량',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;


export default function RegionExplorePage() {
    const { toast } = useToast();
    
    const [selectedRegion, setSelectedRegion] = React.useState<{ code: string; name: string } | null>(null);
    const [risingSearches, setRisingSearches] = React.useState<string[]>([]);
    const [isLoadingSearches, setIsLoadingSearches] = React.useState(false);

    const [selectedKeyword, setSelectedKeyword] = React.useState<string | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = React.useState(false);
    
    const [trendData, setTrendData] = React.useState<KeywordTrendPoint[]>([]);
    const [youtubeVideos, setYoutubeVideos] = React.useState<YoutubeVideosData>([]);
    const [naverNews, setNaverNews] = React.useState<RelatedNewsData>([]);

    const handleRegionSelect = async (region: { code: string; name: string }) => {
        setSelectedRegion(region);
        setSelectedKeyword(null);
        setRisingSearches([]);
        setTrendData([]);
        setYoutubeVideos([]);
        setNaverNews([]);
        setIsLoadingSearches(true);

        try {
            const response = await axios.get(`/api/getRisingSearches?regionCode=${region.code}`);
            setRisingSearches(response.data.slice(0, 5));
        } catch (error) {
            console.error("Error fetching rising searches:", error);
            toast({ variant: "destructive", title: "인기 검색어 로드 실패", description: "데이터를 가져오는 데 실패했습니다." });
        } finally {
            setIsLoadingSearches(false);
        }
    };

    const handleKeywordSelect = async (keyword: string) => {
        setSelectedKeyword(keyword);
        setIsLoadingDetails(true);
        setTrendData([]);
        setYoutubeVideos([]);
        setNaverNews([]);

        try {
            const [trends, videos, news] = await Promise.all([
                getKeywordTrendsAction({ keyword, timeRange: '1m' }),
                getYoutubeVideosAction({ keyword }),
                getNaverNewsAction({ keyword }),
            ]);
            setTrendData(trends);
            setYoutubeVideos(videos);
            setNaverNews(news);
        } catch (error) {
            console.error(`Error fetching details for ${keyword}:`, error);
            toast({ variant: "destructive", title: "상세 정보 로드 실패", description: `"${keyword}"의 데이터를 가져오지 못했습니다.` });
        } finally {
            setIsLoadingDetails(false);
        }
    };

     const handleVideoClick = (videoId: string) => {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">지역별 인기 급상승 키워드</h1>
                <p className="text-muted-foreground">지도에서 지역을 선택하여 최신 트렌드를 확인하세요.</p>
            </header>
            
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[400px] md:h-[600px] rounded-lg overflow-hidden border">
                     <RegionMap onRegionSelect={handleRegionSelect} selectedRegionCode={selectedRegion?.code}/>
                </div>
                
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center"><TrendingUp className="mr-2" /> 인기 급상승 검색어</CardTitle>
                            <CardDescription>{selectedRegion ? `${selectedRegion.name}의 최근 인기 급상승 검색어입니다.` : '지도에서 지역을 선택해주세요.'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSearches ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                                </div>
                            ) : risingSearches.length > 0 ? (
                                <ul className="space-y-2">
                                    {risingSearches.map((keyword, index) => (
                                        <li key={index}>
                                            <Button 
                                                variant={selectedKeyword === keyword ? 'default' : 'outline'}
                                                className="w-full justify-start text-left h-auto"
                                                onClick={() => handleKeywordSelect(keyword)}
                                            >
                                                <span className="font-bold text-lg mr-3">{index + 1}</span>
                                                <span className="flex-1">{keyword}</span>
                                                {isLoadingDetails && selectedKeyword === keyword && <LoaderCircle className="animate-spin h-4 w-4" />}
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="h-48 flex items-center justify-center text-muted-foreground">
                                    <p>{selectedRegion ? '인기 검색어가 없습니다.' : '지역을 선택해주세요.'}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {selectedKeyword && (
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><Newspaper className="mr-2" /> 관련 뉴스</CardTitle>
                                <CardDescription>'{selectedKeyword}' 관련 최신 뉴스입니다.</CardDescription>
                            </CardHeader>
                            <CardContent>
                               {isLoadingDetails ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-16 w-full" />
                                        <Skeleton className="h-16 w-full" />
                                    </div>
                               ) : naverNews.length > 0 ? (
                                   <ul className="space-y-3 max-h-60 overflow-y-auto">
                                       {naverNews.slice(0, 3).map((item, index) => (
                                           <li key={index} className="border-b pb-2 last:border-0 last:pb-0">
                                               <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                   <h4 className="font-semibold truncate">{item.title}</h4>
                                                   <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                                               </a>
                                           </li>
                                       ))}
                                   </ul>
                               ) : (
                                   <p className="text-sm text-muted-foreground text-center py-4">관련 뉴스가 없습니다.</p>
                               )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {selectedKeyword && (
                 <div className="mt-6 grid lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>검색량 추이</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-72">
                                {isLoadingDetails ? (
                                <Skeleton className="w-full h-full" />
                                ) : trendData.length > 0 ? (
                                <ChartContainer config={chartConfig} className="w-full h-full">
                                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => format(parseISO(value), 'M/d', { locale: ko })}
                                    />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="dot" />}
                                    />
                                    <Line
                                        dataKey="value"
                                        type="monotone"
                                        stroke="var(--color-value)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                    </LineChart>
                                </ChartContainer>
                                ) : (
                                <div className="h-full bg-muted rounded-md flex items-center justify-center">
                                    <p className="text-muted-foreground">차트 데이터가 없습니다.</p>
                                </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                           <CardTitle className="flex items-center"><Youtube className="mr-2"/> 관련 영상</CardTitle>
                        </CardHeader>
                        <CardContent>
                        {isLoadingDetails ? (
                             Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center space-x-4 mb-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[250px]" />
                                        <Skeleton className="h-4 w-[200px]" />
                                    </div>
                                </div>
                            ))
                        ) : youtubeVideos.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>제목</TableHead>
                                        <TableHead>채널</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {youtubeVideos.slice(0, 3).map((video) => (
                                        <TableRow 
                                            key={video.id} 
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleVideoClick(video.id)}
                                        >
                                            <TableCell className="font-medium max-w-xs truncate">{video.title}</TableCell>
                                            <TableCell>{video.channelTitle}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                             <p className="text-sm text-muted-foreground text-center py-4">관련 영상이 없습니다.</p>
                        )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
