
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoaderCircle, MapPin, TrendingUp, Newspaper, Youtube, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
import { getRegionalDashboardAction } from '@/app/actions';
import type { RegionalDashboardOutput } from '@/ai/flows/regional-dashboard-flow';


const chartConfig = {
  value: {
    label: '검색량',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

type DashboardData = RegionalDashboardOutput | null;

export default function RegionExplorePage() {
    const { toast } = useToast();
    
    const [selectedRegion, setSelectedRegion] = React.useState<{ code: string; name: string } | null>(null);
    const [dashboardData, setDashboardData] = React.useState<DashboardData>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleRegionSelect = async (region: { code: string; name: string }) => {
        setSelectedRegion(region);
        setDashboardData(null);
        setIsLoading(true);

        const countryMap: Record<string, { code: string; name: string }> = {
            'KR-11': { code: 'KR', name: '한국' }, // 서울
            'KR-26': { code: 'KR', name: '한국' }, // 부산
            'KR-27': { code: 'KR', name: '한국' }, // 대구
            'KR-28': { code: 'KR', name: '한국' }, // 인천
            'KR-29': { code: 'KR', name: '한국' }, // 광주
            'KR-30': { code: 'KR', name: '한국' }, // 대전
            'KR-31': { code: 'KR', name: '한국' }, // 울산
            'KR-50': { code: 'KR', name: '한국' }, // 세종
            'KR-41': { code: 'KR', name: '한국' }, // 경기
            'KR-42': { code: 'KR', name: '한국' }, // 강원
            'KR-43': { code: 'KR', name: '한국' }, // 충북
            'KR-44': { code: 'KR', name: '한국' }, // 충남
            'KR-45': { code: 'KR', name: '한국' }, // 전북
            'KR-46': { code: 'KR', name: '한국' }, // 전남
            'KR-47': { code: 'KR', name: '한국' }, // 경북
            'KR-48': { code: 'KR', name: '한국' }, // 경남
            'KR-49': { code: 'KR', name: '한국' }, // 제주
        };
        const countryInfo = countryMap[region.code] || { code: 'KR', name: '한국' };

        try {
            const result = await getRegionalDashboardAction({ 
                region: region.name,
                countryCode: countryInfo.code,
                countryName: countryInfo.name
            });
            setDashboardData(result);
        } catch (error) {
            console.error("Error fetching regional dashboard data:", error);
            toast({ variant: "destructive", title: "대시보드 로드 실패", description: "데이터를 가져오는 데 실패했습니다." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVideoClick = (videoId: string) => {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">지역별 트렌드 대시보드</h1>
                <p className="text-muted-foreground">지도에서 지역을 선택하여 최신 트렌드를 확인하세요.</p>
            </header>
            
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 h-[400px] md:h-[600px] rounded-lg overflow-hidden border">
                     <RegionMap onRegionSelect={handleRegionSelect} selectedRegionCode={selectedRegion?.code}/>
                </div>
                
                <div className="lg:col-span-2 space-y-6">
                    {isLoading ? (
                        <DashboardSkeleton />
                    ) : selectedRegion && dashboardData ? (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center"><Bot className="mr-2" /> AI 트렌드 요약</CardTitle>
                                    <CardDescription>{selectedRegion.name}의 No.1 트렌드: <span className='font-bold text-primary'>{dashboardData.topKeyword}</span></CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm md:text-base">{dashboardData.summary}</p>
                                </CardContent>
                            </Card>

                            <div className="grid md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center"><TrendingUp className="mr-2" />검색량 추이</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-60">
                                            {dashboardData.trendData.length > 0 ? (
                                                <ChartContainer config={chartConfig} className="w-full h-full">
                                                    <LineChart data={dashboardData.trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                        <CartesianGrid vertical={false} />
                                                        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => format(parseISO(value), 'M/d', { locale: ko })} />
                                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                                        <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={2} dot={false} />
                                                    </LineChart>
                                                </ChartContainer>
                                            ) : <p className="text-center text-muted-foreground">데이터 없음</p>}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center"><Newspaper className="mr-2" /> 관련 뉴스</CardTitle>
                                    </CardHeader>
                                    <CardContent className="max-h-72 overflow-y-auto">
                                        {dashboardData.naverNews.length > 0 ? (
                                            <ul className="space-y-3">
                                                {dashboardData.naverNews.slice(0, 5).map((item: any, index: number) => (
                                                    <li key={index} className="border-b pb-2 last:border-0 last:pb-0">
                                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                            <h4 className="font-semibold truncate">{item.title}</h4>
                                                            <p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p>
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : <p className="text-center text-muted-foreground">데이터 없음</p>}
                                    </CardContent>
                                </Card>
                            </div>
                            <Card>
                                <CardHeader>
                                <CardTitle className="flex items-center"><Youtube className="mr-2"/> 관련 영상</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {dashboardData.youtubeVideos.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>제목</TableHead>
                                                    <TableHead>채널</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {dashboardData.youtubeVideos.slice(0, 3).map((video: any) => (
                                                    <TableRow key={video.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleVideoClick(video.id)}>
                                                        <TableCell className="font-medium max-w-xs truncate">{video.title}</TableCell>
                                                        <TableCell>{video.channelTitle}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : <p className="text-center text-muted-foreground">데이터 없음</p>}
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <div className="col-span-2 flex items-center justify-center h-full min-h-[600px] bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                            <div className="text-center">
                                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h2 className="mt-4 text-xl font-semibold">지역을 선택하세요</h2>
                                <p className="mt-1 text-muted-foreground">지도에서 지역을 클릭하여 해당 지역의 트렌드 대시보드를 확인하세요.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const DashboardSkeleton = () => (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4 mt-2" />
            </CardContent>
        </Card>
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                <CardContent><Skeleton className="h-60 w-full" /></CardContent>
            </Card>
            <Card>
                <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        </div>
        <Card>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent><Skeleton className="h-24 w-full" /></CardContent>
        </Card>
    </div>
);
