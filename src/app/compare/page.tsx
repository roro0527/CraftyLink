
'use client';

/**
 * @file 키워드 비교 페이지 컴포넌트입니다.
 * 사용자는 여러 키워드를 추가하여 검색량 추이, 요약 통계 등을 차트와 테이블로 비교할 수 있습니다.
 * 로그인된 사용자는 비교 결과를 자신의 계정에 저장할 수 있습니다.
 */

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
import { Plus, Trash2, X, Save, History, LoaderCircle, LogIn } from 'lucide-react';
import { getKeywordTrendsAction } from '@/app/actions';
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
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useCompareStore } from '@/store/compare-store';
import { useAuth } from '@/hooks/use-auth';
import { useFirestore } from '@/firebase/provider';
import { collection } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';

// 각 데이터 유형에 대한 타입 정의
type TrendData = Record<string, KeywordTrendPoint[]>; // 키워드별 트렌드 데이터
type SummaryData = Record<string, { total: number; average: number }>; // 키워드별 요약 데이터
type AnalysisData = Record<string, { dominanceScore: number }>; // 키워드별 분석 데이터
type ChartableData = { date: string; [keyword: string]: number | string }; // 차트 렌더링용 데이터

// 차트에서 사용할 색상 배열
const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

// 저장 다이얼로그에서 사용할 색상 태그 배열
const saveColors = [
    { id: 'color-1', value: 'bg-red-500', ring: 'ring-red-500' },
    { id: 'color-2', value: 'bg-orange-500', ring: 'ring-orange-500' },
    { id: 'color-3', value: 'bg-yellow-500', ring: 'ring-yellow-500' },
    { id: 'color-4', value: 'bg-green-500', ring: 'ring-green-500' },
    { id: 'color-5', value: 'bg-blue-500', ring: 'ring-blue-500' },
];


export default function ComparePage() {
  const { toast } = useToast();
  const { user, loading: userLoading, signInWithGoogle } = useAuth();
  const firestore = useFirestore();

  // 전역 상태 스토어 사용
  const {
    keywords,
    addKeyword,
    removeKeyword,
    clearKeywords,
  } = useCompareStore();

  // --- State 정의 ---
  const [inputValue, setInputValue] = React.useState(''); // 키워드 입력값
  const [timeRange, setTimeRange] = React.useState<'1w' | '1m' | '5d'>('1w'); // 조회 기간
  const [trendData, setTrendData] = React.useState<TrendData>({}); // API로부터 받은 트렌드 데이터
  const [summaryData, setSummaryData] = React.useState<SummaryData>({}); // 트렌드 데이터 기반 요약 통계
  const [isLoading, setIsLoading] = React.useState(false); // 데이터 로딩 상태
  const [analysisData, setAnalysisData] = React.useState<AnalysisData>({}); // 데이터 분석 결과 (우세 점수 등)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false); // 분석 중 상태
  const [isSaveDialogOpen, setIsSaveDialogOpen] = React.useState(false); // 저장 다이얼로그 표시 여부
  const [saveName, setSaveName] = React.useState(''); // 저장할 이름
  const [selectedColor, setSelectedColor] = React.useState(saveColors[0].value); // 저장 시 선택한 색상

  /**
   * keywords 또는 timeRange가 변경될 때마다 모든 키워드에 대한 트렌드 데이터를 API로 가져옵니다.
   * 가져온 데이터를 기반으로 요약(summary) 및 분석(analysis) 데이터를 계산하고 state를 업데이트합니다.
   */
  React.useEffect(() => {
    if (!user) return; // 로그인하지 않았으면 데이터 요청 안 함

    const fetchAllTrends = async () => {
      if (keywords.length === 0) {
        setTrendData({});
        setSummaryData({});
        setAnalysisData({});
        return;
      }

      setIsLoading(true);
      setIsAnalyzing(true);

      const newTrendData: TrendData = {};
      const newSummaryData: SummaryData = {};

      // 모든 키워드에 대한 API 요청을 병렬로 처리합니다.
      await Promise.all(
        keywords.map(async (keyword) => {
          try {
            const trends = await getKeywordTrendsAction({ keyword, timeRange });
            newTrendData[keyword] = trends;
            const total = trends.reduce((sum, point) => sum + point.value, 0);
            const average = trends.length > 0 ? total / trends.length : 0;
            newSummaryData[keyword] = { total, average: Math.round(average) };
          } catch (error) {
            console.error(`Failed to fetch trends for ${keyword}:`, error);
            toast({
              variant: 'destructive',
              title: `'${keyword}' 트렌드 로드 실패`,
              description: '데이터를 가져오는 중 오류가 발생했습니다.',
            });
            newTrendData[keyword] = [];
            newSummaryData[keyword] = { total: 0, average: 0 };
          }
        })
      );

      // 트렌드 데이터를 기반으로 우세 점수 등 분석 데이터를 계산합니다.
      const newAnalysisData: AnalysisData = {};
      if (Object.keys(newTrendData).length > 0) {
        const allAverages = Object.values(newSummaryData).map((s) => s.average);
        const maxAverage = Math.max(...allAverages);

        for (const keyword of keywords) {
          const Ktrends = newTrendData[keyword];
          if (!Ktrends || Ktrends.length === 0) {
            newAnalysisData[keyword] = { dominanceScore: 0 };
            continue;
          }

          // 1. 평균 검색량 점수 (50점 만점)
          const average = newSummaryData[keyword].average;
          const avgScore = maxAverage > 0 ? (average / maxAverage) * 50 : 0;

          // 2. 성장 추세 점수 (50점 만점)
          let trendScore = 0;
          if (Ktrends.length > 1) {
            const midPoint = Math.ceil(Ktrends.length / 2);
            const firstHalf = Ktrends.slice(0, midPoint);
            const secondHalf = Ktrends.slice(midPoint);
            const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.value, 0) / firstHalf.length;
            const secondHalfAvg = secondHalf.length > 0 ? secondHalf.reduce((sum, p) => sum + p.value, 0) / secondHalf.length : 0;
            const growthRate = firstHalfAvg > 0 ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg : (secondHalfAvg > 0 ? 1 : 0);
            const normalizedGrowth = Math.max(-1, Math.min(1, growthRate)); // -100% ~ +100% 사이로 제한
            trendScore = ((normalizedGrowth + 1) / 2) * 50; // [-1, 1] 범위를 [0, 50]으로 매핑
          }

          newAnalysisData[keyword] = {
            dominanceScore: Math.round(avgScore + trendScore),
          };
        }
      }
      
      // 모든 데이터 처리가 끝난 후 state를 한 번에 업데이트하여 불필요한 리렌더링을 방지합니다.
      setTrendData(newTrendData);
      setSummaryData(newSummaryData);
      setAnalysisData(newAnalysisData);
      setIsLoading(false);
      setIsAnalyzing(false);
    };

    fetchAllTrends();
  }, [keywords, timeRange, toast, user]);

  /**
   * 입력된 키워드를 비교 목록에 추가하는 핸들러입니다.
   */
  const handleAddKeyword = () => {
    if (inputValue && !keywords.includes(inputValue) && keywords.length < 5) {
      addKeyword(inputValue);
      setInputValue('');
    }
  };

  /**
   * 현재 비교 결과를 Firestore에 저장하는 핸들러입니다.
   */
  const handleSave = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: '로그인이 필요합니다.',
        description: '비교 결과를 저장하려면 먼저 로그인해주세요.',
      });
      return;
    }

    const collectionRef = collection(firestore, 'users', user.uid, 'savedComparisonPages');
    const newDoc = {
      userId: user.uid,
      name: saveName,
      color: selectedColor,
      keywords: keywords,
      date: new Date().toISOString(),
      // superParameters는 현재 사용하지 않으므로 빈 배열로 저장
      urlInputs: [], 
      superParameters: [],
    };

    addDocumentNonBlocking(collectionRef, newDoc);

    toast({
        title: "저장 완료",
        description: `'${saveName}'(으)로 비교 결과가 저장되었습니다.`,
    });
    
    setIsSaveDialogOpen(false);
    setSaveName('');
    setSelectedColor(saveColors[0].value);
  };
  
  /**
   * 저장 다이얼로그를 여는 핸들러입니다.
   */
  const handleOpenSaveDialog = () => {
    if (keywords.length === 0) {
      toast({
        variant: 'destructive',
        title: '저장할 데이터가 없습니다.',
        description: '먼저 키워드를 추가하여 비교해주세요.',
      });
      return;
    }
     if (!user) {
      toast({
        variant: 'destructive',
        title: '로그인이 필요합니다.',
        description: '비교 결과를 저장하려면 먼저 로그인해주세요.',
      });
      return;
    }
    setSaveName(`비교: ${keywords.join(', ')}`);
    setIsSaveDialogOpen(true);
  }

  /**
   * 현재 비교 데이터를 CSV 파일로 내보내는 핸들러입니다.
   */
  const handleExportCsv = () => {
    if (keywords.length === 0 || Object.keys(trendData).length === 0) {
      toast({
        variant: 'destructive',
        title: '내보낼 데이터가 없습니다.',
        description: '먼저 키워드를 추가하여 비교해주세요.',
      });
      return;
    }

    let csvContent = '\uFEFF'; // UTF-8 BOM

    // 요약 섹션
    csvContent += '요약\n';
    csvContent += ['키워드', '총 검색량', '평균 검색량', '우세 점수'].join(',') + '\n';
    keywords.forEach(kw => {
      const summary = summaryData[kw] || { total: 0, average: 0 };
      const analysis = analysisData[kw] || { dominanceScore: 0 };
      csvContent += [kw, summary.total, summary.average, analysis.dominanceScore].join(',') + '\n';
    });

    csvContent += '\n';

    // 트렌드 데이터 섹션
    csvContent += '기간별 검색량 추이\n';
    csvContent += ['날짜', ...keywords].join(',') + '\n';
    chartData.forEach(row => {
      const values = keywords.map(kw => row[kw] ?? 0);
      csvContent += `${row.date},${values.join(',')}\n`;
    });

    // CSV 다운로드 로직
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'craftylink_compare_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  /**
   * `useMemo`를 사용하여 keywords 또는 trendData가 변경될 때만 차트 설정을 다시 계산합니다.
   * 이는 불필요한 리렌더링을 방지하고 성능을 최적화합니다.
   */
  const { chartConfig, chartData } = React.useMemo(() => {
    const config: ChartConfig = {};
    keywords.forEach((keyword, index) => {
      config[keyword] = {
        label: keyword,
        color: chartColors[index % chartColors.length],
      };
    });
  
    // 날짜별로 데이터를 병합하기 위해 Map을 사용합니다.
    const dataMap = new Map<string, ChartableData>();
    keywords.forEach(keyword => {
      const trends = trendData[keyword] || [];
      trends.forEach(point => {
        if (!dataMap.has(point.date)) {
          const initialPoint: ChartableData = { date: point.date };
          keywords.forEach(kw => { initialPoint[kw] = 0; });
          dataMap.set(point.date, initialPoint);
        }
        const existingPoint = dataMap.get(point.date)!;
        existingPoint[keyword] = point.value;
      });
    });
    
    // Map을 배열로 변환하고 날짜순으로 정렬합니다.
    const data = Array.from(dataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
    return { chartConfig: config, chartData: data };
  }, [keywords, trendData]);

  if (userLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <header className="flex flex-col sm:flex-row items-center gap-4">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-2 items-center flex-wrap">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-40" />
          </div>
        </header>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">로그인이 필요합니다</h2>
          <p className="text-muted-foreground mb-6">
            키워드 비교 기능은 로그인 후 이용할 수 있습니다.
          </p>
          <Button onClick={signInWithGoogle}>
            <LogIn className="mr-2 h-4 w-4" />
            구글 계정으로 로그인
          </Button>
        </div>
      </div>
    );
  }

  // --- JSX 렌더링 ---
  return (
    <div className="p-6 space-y-6">
      {/* 헤더: 페이지 제목 및 키워드 입력/관리 */}
      <header className="flex flex-col sm:flex-row items-center gap-4">
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
          <Button onClick={clearKeywords} variant="outline">
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

      {/* 키워드 태그 및 액션 버튼 */}
       <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
            <span key={index} className="inline-flex items-center bg-muted text-muted-foreground rounded-full pl-3 pr-1 py-1 text-sm font-semibold">
                {keyword}
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 rounded-full" onClick={() => removeKeyword(keyword)}>
                    <X className="h-4 w-4"/>
                </Button>
            </span>
            ))}
        </div>
        <div className="flex gap-2">
            {user && (
              <Button onClick={handleOpenSaveDialog} variant="outline">
                  <Save className="mr-2 h-4 w-4" /> 저장
              </Button>
            )}
            <Button onClick={handleExportCsv} disabled={keywords.length === 0}>CSV 내보내기</Button>
        </div>
      </div>

      {/* 차트 섹션 */}
      <section id="charts" className="grid grid-cols-1 gap-6">
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
                        tickFormatter={(value) => {
                           try {
                            return format(parseISO(value), 'M/d', { locale: ko });
                           } catch (e) {
                            return value;
                           }
                        }}
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

      {/* 요약 테이블 섹션 */}
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
                  <TableHead>우세 점수</TableHead>
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
                         {isAnalyzing || isLoading ? <Skeleton className="h-5 w-24" /> : (
                          analysisData[keyword] ? analysisData[keyword].dominanceScore : '-'
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

      {/* 저장 다이얼로그 */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>비교 결과 저장</DialogTitle>
                <DialogDescription>
                    현재 비교 중인 키워드를 저장합니다. 저장된 항목은 사이드바에서 확인할 수 있습니다.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label htmlFor="save-name">이름</Label>
                    <Input id="save-name" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="예: 2분기 스마트폰 시장 비교"/>
                </div>
                <div className="space-y-2">
                   <Label>색상 태그</Label>
                   <RadioGroup
                        defaultValue={selectedColor}
                        onValueChange={setSelectedColor}
                        className="flex space-x-2"
                    >
                        {saveColors.map(color => (
                            <RadioGroupItem key={color.id} value={color.value} id={color.id} className="sr-only" />
                        ))}
                         {saveColors.map(color => (
                            <Label key={`label-${color.id}`} htmlFor={color.id} className={`h-8 w-8 rounded-full cursor-pointer ${color.value} ${selectedColor === color.value ? `ring-2 ring-offset-2 ${color.ring}`: ''}`}></Label>
                        ))}
                    </RadioGroup>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">취소</Button>
                </DialogClose>
                <Button type="button" onClick={handleSave} disabled={!saveName}>저장하기</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

    