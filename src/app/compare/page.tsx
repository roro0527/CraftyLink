
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, X } from 'lucide-react';
import { getKeywordTrendsAction, analyzeKeywordTrendsAction } from '@/app/actions';
import type { KeywordTrendPoint } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { TrendAnalysisData } from '@/ai/flows/trend-analysis-flow';

type TrendData = Record<string, KeywordTrendPoint[]>;
type SummaryData = Record<string, { total: number; average: number }>;
type ChartableData = { date: string; [keyword: string]: number | string };

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function ComparePage() {
  const [keywords, setKeywords] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [timeRange, setTimeRange] = React.useState<'1w' | '1m' | '5d'>('1w');
  const [trendData, setTrendData] = React.useState<TrendData>({});
  const [summaryData, setSummaryData] = React.useState<SummaryData>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisData, setAnalysisData] = React.useState<TrendAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  React.useEffect(() => {
    const fetchAllTrends = async () => {
      if (keywords.length === 0) {
        setTrendData({});
        setSummaryData({});
        setAnalysisData(null);
        return;
      }

      setIsLoading(true);
      setIsAnalyzing(true);
      setAnalysisData(null);
      const newTrendData: TrendData = {};
      const newSummaryData: SummaryData = {};

      await Promise.all(
        keywords.map(async (keyword) => {
          const trends = await getKeywordTrendsAction({ keyword, timeRange });
          newTrendData[keyword] = trends;
          const total = trends.reduce((sum, point) => sum + point.value, 0);
          const average = trends.length > 0 ? total / trends.length : 0;
          newSummaryData[keyword] = { total, average: Math.round(average) };
        })
      );

      setTrendData(newTrendData);
      setSummaryData(newSummaryData);
      setIsLoading(false);
      
      // After fetching trends, perform analysis
      if (Object.keys(newTrendData).length > 0) {
        const analysisResult = await analyzeKeywordTrendsAction({ trendData: newTrendData });
        setAnalysisData(analysisResult);
      }
      setIsAnalyzing(false);
    };

    fetchAllTrends();
  }, [keywords, timeRange]);

  const handleAddKeyword = () => {
    if (inputValue && !keywords.includes(inputValue) && keywords.length < 5) {
      setKeywords([...keywords, inputValue]);
      setInputValue('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(keyword => keyword !== keywordToRemove));
  };
  
  const handleClearKeywords = () => {
    setKeywords([]);
  };

  const { chartConfig, chartData } = React.useMemo(() => {
    const config: ChartConfig = {};
    keywords.forEach((keyword, index) => {
      config[keyword] = {
        label: keyword,
        color: chartColors[index % chartColors.length],
      };
    });

    const allDates = new Set<string>();
    Object.values(trendData).forEach(trends => {
      trends.forEach(point => allDates.add(point.date));
    });
    const sortedDates = Array.from(allDates).sort();
    
    const data: ChartableData[] = sortedDates.map(date => {
      const dataPoint: ChartableData = { date };
      keywords.forEach(keyword => {
        const trendPoint = trendData[keyword]?.find(p => p.date === date);
        dataPoint[keyword] = trendPoint ? trendPoint.value : 0;
      });
      return dataPoint;
    });

    return { chartConfig: config, chartData: data };
  }, [keywords, trendData]);

  return (
    <div className="p-6">
      <header className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">키워드 비교</h1>
        <div className="flex gap-2 items-center flex-wrap">
          <Input
            type="text"
            id="keyword-input"
            placeholder="키워드 입력 (최대 5개)"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
            className="border p-2 rounded"
            disabled={keywords.length >= 5}
          />
          <Button onClick={handleAddKeyword} disabled={keywords.length >= 5}>
            <Plus className="mr-2 h-4 w-4" /> 추가
          </Button>
          <Button onClick={handleClearKeywords} variant="outline">
            <Trash2 className="mr-2 h-4 w-4" /> 초기화
          </Button>
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as '1w' | '1m' | '5d')}>
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
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <span key={index} className="inline-flex items-center bg-muted text-muted-foreground rounded-full pl-3 pr-1 py-1 text-sm font-semibold">
            {keyword}
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 rounded-full" onClick={() => handleRemoveKeyword(keyword)}>
                <X className="h-4 w-4"/>
            </Button>
          </span>
        ))}
      </div>

      <section id="charts" className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>검색량 추이 비교</CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : chartData.length > 0 ? (
                 <ChartContainer config={chartConfig} className="w-full h-full">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                      <Legend />
                      {keywords.map((keyword) => (
                         <Line
                            key={keyword}
                            dataKey={keyword}
                            type="monotone"
                            stroke={chartConfig[keyword]?.color}
                            strokeWidth={2}
                            dot={false}
                         />
                      ))}
                    </LineChart>
                  </ChartContainer>
            ) : (
                 <div className="h-full bg-muted rounded-md flex items-center justify-center">
                    <p className="text-muted-foreground">비교할 키워드를 추가해주세요.</p>
                 </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section id="summary-table" className="overflow-x-auto">
         <Card>
          <CardHeader>
            <CardTitle>요약</CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-full text-left">
              <TableHeader>
                <TableRow>
                  <TableHead>키워드</TableHead>
                  <TableHead>총 검색량</TableHead>
                  <TableHead>평균 검색량</TableHead>
                  <TableHead>우세 여부</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords.length > 0 ? (
                  keywords.map((keyword) => (
                    <TableRow key={keyword}>
                      <TableCell className="font-semibold" style={{color: chartConfig[keyword]?.color}}>{keyword}</TableCell>
                      <TableCell>
                        {isLoading ? <Skeleton className="h-5 w-20" /> : (summaryData[keyword] ? summaryData[keyword].total.toLocaleString() : '데이터 없음')}
                      </TableCell>
                      <TableCell>
                         {isLoading ? <Skeleton className="h-5 w-20" /> : (summaryData[keyword] ? summaryData[keyword].average.toLocaleString() : '데이터 없음')}
                      </TableCell>
                      <TableCell>
                         {isAnalyzing ? <Skeleton className="h-5 w-24" /> : (
                          analysisData && analysisData[keyword] ? (
                            analysisData[keyword].isDominant ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge>우세</Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{analysisData[keyword].reason}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                               <span className="text-muted-foreground">-</span>
                            )
                          ) : '분석중...'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      비교할 키워드를 추가해주세요.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
