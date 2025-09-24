
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
import { Plus, Trash2, X, Save, History } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

type TrendData = Record<string, KeywordTrendPoint[]>;
type SummaryData = Record<string, { total: number; average: number }>;
type AnalysisData = Record<string, { dominanceScore: number }>;
type ChartableData = { date: string; [keyword: string]: number | string };

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const saveColors = [
    { id: 'color-1', value: 'bg-red-500', ring: 'ring-red-500' },
    { id: 'color-2', value: 'bg-orange-500', ring: 'ring-orange-500' },
    { id: 'color-3', value: 'bg-yellow-500', ring: 'ring-yellow-500' },
    { id: 'color-4', value: 'bg-green-500', ring: 'ring-green-500' },
    { id: 'color-5', value: 'bg-blue-500', ring: 'ring-blue-500' },
];

// Mock data for saved comparisons
const initialSavedComparisons = [
  {
    id: 1,
    name: '2분기 스마트폰 시장',
    color: 'bg-blue-500',
    keywords: ['갤럭시', '아이폰'],
    date: '2023-06-28',
  },
  {
    id: 2,
    name: '여름 휴가 여행지',
    color: 'bg-green-500',
    keywords: ['제주도', '강릉', '부산'],
    date: '2023-06-25',
  },
  {
    id: 3,
    name: 'OTT 서비스 경쟁',
    color: 'bg-red-500',
    keywords: ['넷플릭스', '디즈니플러스', '티빙'],
    date: '2023-06-22',
  },
];


export default function ComparePage() {
  const { toast } = useToast();
  const [keywords, setKeywords] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [timeRange, setTimeRange] = React.useState<'1w' | '1m' | '5d'>('1w');
  const [trendData, setTrendData] = React.useState<TrendData>({});
  const [summaryData, setSummaryData] = React.useState<SummaryData>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisData, setAnalysisData] = React.useState<AnalysisData>({});
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = React.useState(false);
  const [saveName, setSaveName] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState(saveColors[0].value);
  const [savedItems, setSavedItems] = React.useState(initialSavedComparisons);


  React.useEffect(() => {
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

      await Promise.all(
        keywords.map(async (keyword) => {
          const trends = await getKeywordTrendsAction({ keyword, timeRange });
          newTrendData[keyword] = trends;
          const total = trends.reduce((sum, point) => sum + point.value, 0);
          const average = trends.length > 0 ? total / trends.length : 0;
          newSummaryData[keyword] = { total, average: Math.round(average) };
        })
      );

      // Perform analysis after fetching trends
      const newAnalysisData: AnalysisData = {};
      if (Object.keys(newTrendData).length > 0) {
        const allAverages = Object.values(newSummaryData).map(
          (s) => s.average
        );
        const maxAverage = Math.max(...allAverages);

        for (const keyword of keywords) {
          const Ktrends = newTrendData[keyword];
          if (!Ktrends || Ktrends.length === 0) {
            newAnalysisData[keyword] = { dominanceScore: 0 };
            continue;
          }

          // 1. Average Volume Score (50 points)
          const average = newSummaryData[keyword].average;
          const avgScore = maxAverage > 0 ? (average / maxAverage) * 50 : 0;

          // 2. Trend Score (50 points)
          let trendScore = 0;
          if (Ktrends.length > 1) {
            const midPoint = Math.ceil(Ktrends.length / 2);
            const firstHalf = Ktrends.slice(0, midPoint);
            const secondHalf = Ktrends.slice(midPoint);

            const firstHalfAvg =
              firstHalf.reduce((sum, p) => sum + p.value, 0) /
              firstHalf.length;
            const secondHalfAvg =
              secondHalf.length > 0
                ? secondHalf.reduce((sum, p) => sum + p.value, 0) /
                  secondHalf.length
                : 0;

            const growthRate =
              firstHalfAvg > 0
                ? (secondHalfAvg - firstHalfAvg) / firstHalfAvg
                : secondHalfAvg > 0
                ? 1
                : 0; // Cap growth at 100% if first half is 0

            // Normalize growth rate to a 0-50 score. Let's say 100% growth (growthRate=1) is 50 points.
            const normalizedGrowth = Math.max(-1, Math.min(1, growthRate)); // Clamp between -100% and +100%
            trendScore = ((normalizedGrowth + 1) / 2) * 50; // Map [-1, 1] to [0, 50]
          }

          newAnalysisData[keyword] = {
            dominanceScore: Math.round(avgScore + trendScore),
          };
        }
      }
      
      // Set all states at once after all data processing is complete
      setTrendData(newTrendData);
      setSummaryData(newSummaryData);
      setAnalysisData(newAnalysisData);
      setIsLoading(false);
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

  const handleSave = () => {
    // Backend logic will be added later
    console.log("Saving comparison:", { name: saveName, color: selectedColor, keywords, trendData, summaryData });
    toast({
        title: "저장 완료",
        description: `'${saveName}'(으)로 비교 결과가 저장되었습니다. (프론트엔드-전용)`,
    });
    setIsSaveDialogOpen(false);
  };
  
  const handleOpenSaveDialog = () => {
    if (keywords.length === 0) {
      toast({
        variant: 'destructive',
        title: '저장할 데이터가 없습니다.',
        description: '먼저 키워드를 추가하여 비교해주세요.',
      });
      return;
    }
    setSaveName(`비교: ${keywords.join(', ')}`);
    setIsSaveDialogOpen(true);
  }

 const handleExportCsv = () => {
    if (keywords.length === 0 || Object.keys(trendData).length === 0) {
      toast({
        variant: 'destructive',
        title: '내보낼 데이터가 없습니다.',
        description: '먼저 키워드를 추가하여 비교해주세요.',
      });
      return;
    }

    let csvContent = '\uFEFF'; // BOM for UTF-8

    // Summary Section
    csvContent += '요약\n';
    const summaryHeaders = ['키워드', '총 검색량', '평균 검색량', '우세 점수'];
    csvContent += summaryHeaders.join(',') + '\n';

    keywords.forEach(kw => {
      const summary = summaryData[kw] || { total: 0, average: 0 };
      const analysis = analysisData[kw] || { dominanceScore: 0 };
      const row = [
        kw,
        summary.total,
        summary.average,
        analysis.dominanceScore
      ];
      csvContent += row.join(',') + '\n';
    });

    csvContent += '\n'; // Add a blank line for separation

    // Trend Data Section
    csvContent += '기간별 검색량 추이\n';
    const trendHeaders = ['날짜', ...keywords];
    csvContent += trendHeaders.join(',') + '\n';

    chartData.forEach(row => {
      const values = keywords.map(kw => row[kw] ?? 0);
      csvContent += `${row.date},${values.join(',')}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'craftylink_compare_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadComparison = (savedKeywords: string[]) => {
    setKeywords(savedKeywords);
    toast({
      title: '불러오기 완료',
      description: `"${savedKeywords.join(', ')}" 비교를 불러왔습니다.`,
    });
  };

  const handleDeleteComparison = (idToDelete: number) => {
    setSavedItems(prev => prev.filter(item => item.id !== idToDelete));
    toast({
        title: "삭제 완료",
        description: "선택한 항목이 삭제되었습니다.",
    });
  };


  const { chartConfig, chartData } = React.useMemo(() => {
    const config: ChartConfig = {};
    keywords.forEach((keyword, index) => {
      config[keyword] = {
        label: keyword,
        color: chartColors[index % chartColors.length],
      };
    });
  
    // Use a map to merge data points by date
    const dataMap = new Map<string, ChartableData>();
  
    // Initialize map with all keywords to ensure all columns are present
    keywords.forEach(keyword => {
      const trends = trendData[keyword] || [];
      trends.forEach(point => {
        if (!dataMap.has(point.date)) {
          const initialPoint: ChartableData = { date: point.date };
          // Ensure all keyword keys are created with a default value
          keywords.forEach(kw => {
            initialPoint[kw] = 0;
          });
          dataMap.set(point.date, initialPoint);
        }
        const existingPoint = dataMap.get(point.date)!;
        existingPoint[keyword] = point.value;
      });
    });
    
    // Convert map to array and sort by date
    const data = Array.from(dataMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
    return { chartConfig: config, chartData: data };
  }, [keywords, trendData]);

  return (
    <div className="p-6 space-y-6">
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
       <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
            <span key={index} className="inline-flex items-center bg-muted text-muted-foreground rounded-full pl-3 pr-1 py-1 text-sm font-semibold">
                {keyword}
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1 rounded-full" onClick={() => handleRemoveKeyword(keyword)}>
                    <X className="h-4 w-4"/>
                </Button>
            </span>
            ))}
        </div>
        <div className="flex gap-2">
            <Button onClick={handleOpenSaveDialog} variant="outline">
                <Save className="mr-2 h-4 w-4" /> 저장
            </Button>
            <Button onClick={handleExportCsv} disabled={keywords.length === 0}>CSV 내보내기</Button>
        </div>
      </div>


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

      <section id="saved-comparisons">
        <Card>
          <CardHeader>
            <CardTitle>저장된 비교 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {savedItems.length > 0 ? (
              <div className="space-y-2">
                {savedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div 
                      className="flex items-center gap-3 cursor-pointer flex-grow"
                      onClick={() => handleLoadComparison(item.keywords)}
                    >
                      <span className={`h-4 w-4 rounded-full ${item.color}`}></span>
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-sm text-muted-foreground hidden sm:inline">
                        ({item.keywords.join(', ')})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                       <span className='hidden sm:inline'>{item.date}</span>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8"
                         onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteComparison(item.id);
                         }}
                       >
                         <Trash2 className="h-4 w-4" />
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <p>저장된 비교 항목이 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>비교 결과 저장</DialogTitle>
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

    