
'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { LoaderCircle, Search, Save } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { getKeywordTrendsAction, getRelatedKeywordsAction } from '@/app/actions';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import type { KeywordTrendPoint } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getYoutubeVideosAction } from '../actions';
import type { YoutubeVideosData } from '@/ai/flows/youtube-videos-flow';
import axios from 'axios';


const chartConfig = {
  value: {
    label: '검색량',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function KeywordPage() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get('q') || '';
  const { toast } = useToast();

  const [keywordSearch, setKeywordSearch] = React.useState(initialKeyword);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isSearchingTrends, setIsSearchingTrends] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [timeRange, setTimeRange] = React.useState<'5d' | '1w' | '1m'>('1w');
  const [trendData, setTrendData] = React.useState<KeywordTrendPoint[]>([]);
  const [totalSearchVolume, setTotalSearchVolume] = React.useState<number | null>(null);
  const [relatedKeywords, setRelatedKeywords] = React.useState<string[]>([]);
  const [isFetchingRelated, setIsFetchingRelated] = React.useState(false);
  const [youtubeVideos, setYoutubeVideos] = React.useState<YoutubeVideosData>([]);
  const [isFetchingVideos, setIsFetchingVideos] = React.useState(false);
  const [maxGrowthRate, setMaxGrowthRate] = React.useState<number | null>(null);


  const keywordData = {
    name: keywordSearch,
    description: '이 키워드에 대한 간단한 설명입니다.',
  };

  const calculateTotalVolume = (data: KeywordTrendPoint[]) => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, point) => sum + point.value, 0);
  };

  const findMaxGrowthRate = (videos: YoutubeVideosData) => {
    if (!videos || videos.length === 0) return 0;
    return Math.max(...videos.map(video => video.growthRate || 0));
  };
  
  const handleSearch = React.useCallback(async (keyword: string) => {
    if (!keyword.trim()) return;
    
    setIsSearching(true);
    setIsSearchingTrends(true);
    setIsFetchingRelated(true);
    setIsFetchingVideos(true);
    setTrendData([]);
    setTotalSearchVolume(null);
    setRelatedKeywords([]);
    setYoutubeVideos([]);
    setMaxGrowthRate(null);

    try {
      // Fetch all data in parallel
      const [trendResult, relatedResult, videoResult] = await Promise.all([
        getKeywordTrendsAction({ keyword, timeRange }),
        getRelatedKeywordsAction({ keyword }),
        getYoutubeVideosAction({ keyword })
      ]);
      
      // Set state for all results
      setTrendData(trendResult);
      setTotalSearchVolume(calculateTotalVolume(trendResult));
      setRelatedKeywords(relatedResult);
      setYoutubeVideos(videoResult);
      setMaxGrowthRate(findMaxGrowthRate(videoResult));

    } catch (error) {
        console.error("An error occurred during search:", error);
        toast({
            variant: "destructive",
            title: "검색 중 오류 발생",
            description: "데이터를 가져오는 데 실패했습니다. 다시 시도해주세요.",
        });
    } finally {
        setIsSearching(false);
        setIsSearchingTrends(false);
        setIsFetchingVideos(false);
        setIsFetchingRelated(false);
    }
  }, [timeRange, toast]);

  React.useEffect(() => {
    if (initialKeyword) {
        handleSearch(initialKeyword);
    }
  }, [initialKeyword, handleSearch]);

  React.useEffect(() => {
    if (keywordSearch.trim() && !isSearching) {
      let isActive = true;
      const fetchTrends = async () => {
        setIsSearchingTrends(true);
        try {
          const trendResult = await getKeywordTrendsAction({ keyword: keywordSearch, timeRange });
          if (isActive) {
            setTrendData(trendResult);
            setTotalSearchVolume(calculateTotalVolume(trendResult));
          }
        } catch (error) {
           console.error("An error occurred fetching trends:", error);
           if (isActive) {
             toast({
                variant: "destructive",
                title: "트렌드 데이터 로드 실패",
                description: "시간 범위에 따른 트렌드 데이터를 가져오는 데 실패했습니다.",
             });
           }
        } finally {
          if (isActive) {
            setIsSearchingTrends(false);
          }
        }
      };
      fetchTrends();
      
      return () => {
        isActive = false;
      };
    }
  }, [timeRange, keywordSearch, isSearching, toast]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch(keywordSearch);
    }
  };
  
  const handleTagClick = (tag: string) => {
    setKeywordSearch(tag);
    handleSearch(tag);
  };
  
  const handleVideoClick = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
  };

  const handleSave = async () => {
    if (!keywordSearch.trim() || isSaving) return;
    setIsSaving(true);
    try {
      const response = await axios.post('/api/saveKeywordData', {
        keyword: keywordSearch,
        trendData,
        youtubeVideos,
        relatedKeywords,
      });

      if (response.data.success) {
        toast({
          title: "저장 완료",
          description: `'${keywordSearch}'에 대한 검색 결과가 저장되었습니다. (ID: ${response.data.docId})`,
        });
      } else {
        throw new Error(response.data.error || 'Save operation failed');
      }
    } catch (error) {
      console.error("Failed to save keyword data:", error);
      toast({
        variant: "destructive",
        title: "저장 실패",
        description: "데이터를 저장하는 중에 오류가 발생했습니다.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCsv = () => {
    if (trendData.length === 0 && youtubeVideos.length === 0) {
      toast({
        variant: 'destructive',
        title: '내보낼 데이터가 없습니다.',
        description: '먼저 키워드를 검색해주세요.',
      });
      return;
    }

    let csvContent = '\uFEFF'; // BOM for UTF-8

    // Add Trend Data
    csvContent += '키워드 검색 빈도\n';
    csvContent += '날짜,검색량\n';
    trendData.forEach(item => {
      csvContent += `${item.date},${item.value}\n`;
    });
    csvContent += '\n';

    // Add YouTube Video Data
    csvContent += '관련 영상 목록\n';
    csvContent += '제목,업로드일,조회수,채널,조회수 증가율\n';
    youtubeVideos.forEach(video => {
      const title = video.title.replace(/"/g, '""'); // Escape double quotes
      csvContent += `"${title}",${format(parseISO(video.publishedAt), 'yyyy-MM-dd')},${video.viewCount},${video.channelTitle},${video.growthRate?.toFixed(2) || 0}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'craftylink_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div id="keyword-page" className="p-6">
      {/* 상단: 키워드 개요 + KPI */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div className="w-full md:w-auto md:max-w-md">
           <div className="relative">
             <Input
              type="text"
              placeholder="키워드 검색..."
              value={keywordSearch}
              onChange={(e) => setKeywordSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-14 pr-4 h-14 text-3xl font-bold rounded-lg border-2 border-transparent hover:border-border focus:border-primary transition-colors bg-card"
              disabled={isSearching}
            />
            <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSearch(keywordSearch)}
                disabled={isSearching || !keywordSearch.trim()}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10"
              >
                {isSearching ? (
                  <LoaderCircle className="h-6 w-6 text-gray-400 animate-spin" />
                ) : (
                  <Search className="h-6 w-6 text-gray-500" />
                )}
                 <span className="sr-only">검색</span>
              </Button>
          </div>
          <p className="text-muted-foreground mt-2 ml-2">{keywordData.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 md:mt-0 w-full md:w-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">검색량</CardTitle>
            </CardHeader>
            <CardContent>
              {isSearching || isSearchingTrends ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {totalSearchVolume !== null ? totalSearchVolume.toLocaleString() : 'N/A'}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">최고 증가율</CardTitle>
            </CardHeader>
            <CardContent>
               {isSearching || isFetchingVideos ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {maxGrowthRate !== null ? maxGrowthRate.toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 시간 범위 선택 + 액션 버튼 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as '5d' | '1w' | '1m')} disabled={isSearching || !keywordSearch.trim()}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="시간 범위 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5d">최근 5일</SelectItem>
            <SelectItem value="1w">최근 1주</SelectItem>
            <SelectItem value="1m">최근 1개월</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleSave} disabled={isSaving || isSearching || !keywordSearch.trim()}>
            {isSaving ? <LoaderCircle className="animate-spin" /> : <Save />}
            저장
          </Button>
          <Button onClick={handleExportCsv}>CSV 내보내기</Button>
        </div>
      </div>

      {/* 메인 영역: 선그래프 + 테이블 + 사이드 */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>키워드 검색 빈도</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                {isSearching || isSearchingTrends ? (
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
              <CardTitle>관련 영상 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>업로드일</TableHead>
                    <TableHead>조회수</TableHead>
                    <TableHead>채널</TableHead>
                    <TableHead>증가율</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {isFetchingVideos ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skel-${i}`}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      </TableRow>
                    ))
                  ) : youtubeVideos.length > 0 ? (
                    youtubeVideos.map((video) => (
                      <TableRow 
                        key={video.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleVideoClick(video.id)}
                      >
                        <TableCell className="font-medium">{video.title}</TableCell>
                        <TableCell>{format(parseISO(video.publishedAt), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>{parseInt(video.viewCount).toLocaleString()}</TableCell>
                        <TableCell>{video.channelTitle}</TableCell>
                        <TableCell>{video.growthRate?.toFixed(2) || 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        데이터가 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>연관 태그</CardTitle>
            </CardHeader>
            <CardContent className="h-full min-h-[240px]">
              {isFetchingRelated ? (
                 <div className="space-y-2 pt-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-4/5" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-8 w-5/6" />
                 </div>
              ) : relatedKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {relatedKeywords.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="text-base font-normal cursor-pointer hover:bg-primary/20"
                      onClick={() => handleTagClick(tag)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                   <p className="text-muted-foreground">연관 태그가 없습니다.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
