
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
import { LoaderCircle, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { getKeywordTrendsAction, getRelatedKeywordsAction } from '@/app/actions';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import type { KeywordTrendPoint } from '@/lib/types';
import { Badge } from '@/components/ui/badge';


const chartConfig = {
  value: {
    label: '검색량',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export default function KeywordPage() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get('q') || '';

  const [keywordSearch, setKeywordSearch] = React.useState(initialKeyword);
  const [isSearching, setIsSearching] = React.useState(false);
  const [timeRange, setTimeRange] = React.useState<'5d' | '1w' | '1m'>('1w');
  const [trendData, setTrendData] = React.useState<KeywordTrendPoint[]>([]);
  const [relatedKeywords, setRelatedKeywords] = React.useState<string[]>([]);
  const [isFetchingRelated, setIsFetchingRelated] = React.useState(false);

  const keywordData = {
    name: keywordSearch,
    description: '이 키워드에 대한 간단한 설명입니다.',
    kpi: {
      searchVolume: '1.2M',
      frequency: '5,820',
    },
  };
  
  const handleSearch = React.useCallback(async () => {
    if (!keywordSearch.trim()) return;
    setIsSearching(true);
    setIsFetchingRelated(true);
    setTrendData([]); 
    setRelatedKeywords([]);

    try {
      const trendAction = getKeywordTrendsAction({ keyword: keywordSearch, timeRange });
      const relatedAction = getRelatedKeywordsAction({ keyword: keywordSearch });
      
      const [trendResult, relatedResult] = await Promise.all([trendAction, relatedAction]);
      
      setTrendData(trendResult);
      setRelatedKeywords(relatedResult);

    } catch (error) => {
      console.error(error);
      // Handle error with a toast or message
    } finally {
      setIsSearching(false);
      setIsFetchingRelated(false);
    }
  }, [keywordSearch, timeRange]);

  React.useEffect(() => {
    const queryKeyword = searchParams.get('q');
    if (queryKeyword) {
      // Only set and search if the keyword from URL is different from current one
      if(queryKeyword !== keywordSearch) {
        setKeywordSearch(queryKeyword);
      }
      handleSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, handleSearch]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div id="keyword-page" className="p-6">
      {/* 상단: 키워드 개요 + KPI */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div className="w-full md:w-auto md:max-w-md">
           <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={handleSearch}
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
            <Input
              type="text"
              placeholder="키워드 검색..."
              value={keywordSearch}
              onChange={(e) => setKeywordSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-14 pr-4 h-14 text-3xl font-bold rounded-lg border-2 border-transparent hover:border-border focus:border-primary transition-colors bg-card"
              disabled={isSearching}
            />
          </div>
          <p className="text-muted-foreground mt-2 ml-2">{keywordData.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 md:mt-0 w-full md:w-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">검색량</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{keywordData.kpi.searchVolume}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">등장 빈도</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{keywordData.kpi.frequency}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 시간 범위 선택 + 액션 버튼 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <Select value={timeRange} onValueChange={(value) => setTimeRange(value as '5d' | '1w' | '1m')}>
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
          <Button variant="outline">저장</Button>
          <Button variant="outline">비교</Button>
          <Button variant="outline">경보</Button>
          <Button>CSV 내보내기</Button>
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
                {isSearching ? (
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
                        dot={true}
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
                    <TableHead>구독자 증가</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
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
            <CardContent>
              {isFetchingRelated ? (
                 <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-4/5" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-8 w-5/6" />
                 </div>
              ) : relatedKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {relatedKeywords.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-base">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="h-60 flex items-center justify-center">
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
