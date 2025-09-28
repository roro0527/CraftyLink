
'use client';

/**
 * @file 단일 키워드 상세 분석 페이지 컴포넌트입니다.
 * 사용자는 키워드를 검색하여 검색량 추이, 관련 영상, 연관 태그 등 다양한 정보를 확인할 수 있습니다.
 */

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
import { LoaderCircle, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { getKeywordTrendsAction, getRelatedKeywordsAction, getYoutubeVideosAction } from '@/app/actions';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import type { KeywordTrendPoint } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { YoutubeVideosData } from '@/ai/flows/youtube-videos-flow';


// 차트 설정을 정의합니다.
const chartConfig = {
  value: {
    label: '검색량',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function KeywordPage() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get('q') || ''; // URL 쿼리 파라미터에서 초기 키워드를 가져옵니다.
  const { toast } = useToast();

  // --- State 정의 ---
  const [keywordSearch, setKeywordSearch] = React.useState(initialKeyword); // 현재 검색 중인 키워드
  const [isSearching, setIsSearching] = React.useState(false); // 전체 데이터 검색 중 상태
  const [isSearchingTrends, setIsSearchingTrends] = React.useState(false); // 트렌드 데이터만 검색 중 상태
  const [timeRange, setTimeRange] = React.useState<'5d' | '1w' | '1m'>('1w'); // 조회 기간
  const [trendData, setTrendData] = React.useState<KeywordTrendPoint[]>([]); // 트렌드 데이터
  const [totalSearchVolume, setTotalSearchVolume] = React.useState<number | null>(null); // 총 검색량
  const [relatedKeywords, setRelatedKeywords] = React.useState<string[]>([]); // 연관 키워드
  const [isFetchingRelated, setIsFetchingRelated] = React.useState(false); // 연관 키워드 로딩 상태
  const [youtubeVideos, setYoutubeVideos] = React.useState<YoutubeVideosData>({ videos: [], nextPageToken: null }); // 유튜브 영상 데이터
  const [isFetchingVideos, setIsFetchingVideos] = React.useState(false); // 유튜브 영상 로딩 상태

  // 목업 데이터
  const keywordData = {
    name: keywordSearch,
    description: '이 키워드에 대한 간단한 설명입니다.',
  };

  /**
   * 트렌드 데이터 배열을 받아 총 검색량을 계산합니다.
   * @param data 키워드 트렌드 포인트 배열
   * @returns 총 검색량
   */
  const calculateTotalVolume = (data: KeywordTrendPoint[]) => {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, point) => sum + point.value, 0);
  };

  /**
   * 키워드에 대한 모든 관련 데이터(트렌드, 연관 키워드, 유튜브 영상)를 병렬로 가져오는 함수입니다.
   * @param keyword 검색할 키워드
   */
  const handleSearch = React.useCallback(async (keyword: string) => {
    if (!keyword.trim()) return;
    
    // 모든 로딩 상태를 true로 설정하고 이전 데이터를 초기화합니다.
    setIsSearching(true);
    setIsSearchingTrends(true);
    setIsFetchingRelated(true);
    setIsFetchingVideos(true);
    setTrendData([]);
    setTotalSearchVolume(null);
    setRelatedKeywords([]);
    setYoutubeVideos({ videos: [], nextPageToken: null });

    try {
      // 모든 데이터 요청을 Promise.all을 사용하여 병렬로 처리합니다.
      const [trendResult, relatedResult, videoResult] = await Promise.all([
        getKeywordTrendsAction({ keyword, timeRange }),
        getRelatedKeywordsAction({ keyword }),
        getYoutubeVideosAction({ keyword })
      ]);
      
      // 받아온 결과로 state를 업데이트합니다.
      setTrendData(trendResult);
      setTotalSearchVolume(calculateTotalVolume(trendResult));
      setRelatedKeywords(relatedResult);
      setYoutubeVideos(videoResult);

    } catch (error) {
        console.error("An error occurred during search:", error);
        toast({
            variant: "destructive",
            title: "검색 중 오류 발생",
            description: "데이터를 가져오는 데 실패했습니다. 다시 시도해주세요.",
        });
    } finally {
        // 모든 로딩 상태를 false로 설정합니다.
        setIsSearching(false);
        setIsSearchingTrends(false);
        setIsFetchingVideos(false);
        setIsFetchingRelated(false);
    }
  }, [timeRange, toast]); // timeRange 또는 toast 함수가 변경될 때만 이 함수를 재생성합니다.

  /**
   * 페이지 로드 시 URL에 'q' 파라미터가 있으면 초기 검색을 수행합니다.
   */
  React.useEffect(() => {
    if (initialKeyword) {
        handleSearch(initialKeyword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKeyword]); // initialKeyword가 변경될 때만 실행됩니다.

  /**
   * 조회 기간(timeRange)이 변경될 때 트렌드 데이터만 다시 가져옵니다.
   */
  React.useEffect(() => {
    const fetchTrends = async () => {
        if (!keywordSearch.trim() || isSearching) return;
        
        setIsSearchingTrends(true);
        try {
            const trendResult = await getKeywordTrendsAction({ keyword: keywordSearch, timeRange });
            setTrendData(trendResult);
            setTotalSearchVolume(calculateTotalVolume(trendResult));
        } catch (error) {
            console.error("An error occurred fetching trends:", error);
            toast({
                variant: "destructive",
                title: "트렌드 데이터 로드 실패",
                description: "시간 범위에 따른 트렌드 데이터를 가져오는 데 실패했습니다.",
            });
            setTrendData([]);
            setTotalSearchVolume(0);
        } finally {
            setIsSearchingTrends(false);
        }
    };
    if (keywordSearch) {
      fetchTrends();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]); // timeRange가 변경될 때만 실행됩니다.

  /**
   * 검색창에서 Enter 키를 누르면 검색을 실행하는 핸들러입니다.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch(keywordSearch);
    }
  };
  
  /**
   * 연관 태그를 클릭하면 해당 태그로 새로운 검색을 실행하는 핸들러입니다.
   */
  const handleTagClick = (tag: string) => {
    setKeywordSearch(tag);
    handleSearch(tag);
  };
  
  /**
   * 비디오 목록 항목을 클릭하면 새 탭에서 유튜브 영상 페이지를 여는 핸들러입니다.
   */
  const handleVideoClick = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
  };

  // --- JSX 렌더링 ---
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
        <div className="grid grid-cols-1 gap-4 mt-4 md:mt-0 w-full md:w-auto">
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
        </div>
      </div>

      {/* 시간 범위 선택 */}
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
      </div>

      {/* 메인 영역: 차트, 테이블, 연관 태그 */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           {/* 키워드 검색 빈도 차트 */}
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
          {/* 관련 영상 목록 테이블 */}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {isFetchingVideos ? (
                    // 로딩 중 스켈레톤 UI
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skel-${i}`}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      </TableRow>
                    ))
                  ) : youtubeVideos.videos.length > 0 ? (
                    // 데이터가 있을 경우
                    youtubeVideos.videos.map((video) => (
                      <TableRow 
                        key={video.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleVideoClick(video.id)}
                      >
                        <TableCell className="font-medium">{video.title}</TableCell>
                        <TableCell>{format(parseISO(video.publishedAt), 'yyyy-MM-dd')}</TableCell>
                        <TableCell>{parseInt(video.viewCount).toLocaleString()}</TableCell>
                        <TableCell>{video.channelTitle}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    // 데이터가 없을 경우
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
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
           {/* 연관 태그 */}
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
