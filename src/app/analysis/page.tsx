
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoaderCircle, Search, PieChartIcon, BarChartIcon, LineChartIcon } from 'lucide-react';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getGenderAgeTrendAction, getSeasonalPatternAction } from '@/app/actions';
import type { GenderAgeTrendData, SeasonalPatternData } from '@/lib/types';


const GENDER_COLORS = ['#0088FE', '#FF8042'];
const AGE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

export default function AnalysisPage() {
  const { toast } = useToast();
  const [keyword, setKeyword] = React.useState('');
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [genderAgeData, setGenderAgeData] = React.useState<GenderAgeTrendData | null>(null);
  const [seasonalData, setSeasonalData] = React.useState<SeasonalPatternData | null>(null);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast({
        variant: 'destructive',
        title: '검색어를 입력해주세요.',
      });
      return;
    }
    if (!dateRange?.from || !dateRange?.to) {
        toast({
            variant: 'destructive',
            title: '기간을 선택해주세요.',
        });
        return;
    }

    setIsLoading(true);
    setGenderAgeData(null);
    setSeasonalData(null);

    try {
        const startDate = format(dateRange.from, 'yyyy-MM-dd');
        const endDate = format(dateRange.to, 'yyyy-MM-dd');

        const [genderAgeResult, seasonalResult] = await Promise.all([
            getGenderAgeTrendAction({ keyword, startDate, endDate }),
            getSeasonalPatternAction({ keyword, startDate, endDate }),
        ]);

        setGenderAgeData(genderAgeResult);
        setSeasonalData(seasonalResult);

    } catch (error) {
        console.error("Error during analysis:", error);
        toast({
            variant: "destructive",
            title: "분석 중 오류 발생",
            description: "데이터를 가져오는 데 실패했습니다. 다시 시도해주세요.",
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const formattedAgeData = genderAgeData?.ageGroups.map(item => ({
    name: item.group.replace('s', '대'),
    value: item.ratio
  })).sort((a, b) => parseInt(a.name) - parseInt(b.name));

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">통계 분석</h1>
        <p className="text-muted-foreground">키워드에 대한 심층적인 트렌드 분석을 확인하세요.</p>
      </header>

      <div className="flex flex-col md:flex-row items-center gap-4 mb-8 p-4 border rounded-lg bg-card">
         <Input
            type="text"
            placeholder="분석할 키워드를 입력하세요..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="h-11 text-base max-w-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
         />
         <DatePickerWithRange date={dateRange} setDate={setDateRange} className="h-11" />
         <Button onClick={handleSearch} disabled={isLoading} className="h-11">
            {isLoading ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Search />
            )}
            <span className="ml-2">분석하기</span>
         </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
            <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-80 w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-80 w-full" /></CardContent></Card>
        </div>
      ) : !genderAgeData && !seasonalData ? (
        <div className="text-center py-20 bg-muted rounded-lg">
            <p className="text-muted-foreground">분석할 키워드를 입력하고, 기간을 선택한 후 '분석하기' 버튼을 클릭하세요.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><PieChartIcon className="mr-2" />성별/연령별 분석</CardTitle>
                    <CardDescription>키워드에 대한 성별 및 연령대별 관심도 분포입니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div>
                        <h3 className="font-semibold mb-2 text-center">성별 비율</h3>
                        {genderAgeData && genderAgeData.genderGroups.length > 0 ? (
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={genderAgeData.genderGroups} dataKey="ratio" nameKey="group" cx="50%" cy="50%" outerRadius={80} label>
                                        {genderAgeData.genderGroups.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${value.toFixed(1)}%`, name === 'm' ? '남성' : '여성']} />
                                    <Legend formatter={(value) => value === 'm' ? '남성' : '여성'} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <p className="text-center text-muted-foreground">데이터 없음</p>}
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2 text-center">연령대별 검색량</h3>
                         {formattedAgeData && formattedAgeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={formattedAgeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`${value.toFixed(1)}%`, '비율']} />
                                    <Bar dataKey="value" name="비율">
                                        {formattedAgeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <p className="text-center text-muted-foreground">데이터 없음</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><LineChartIcon className="mr-2" />시즌 패턴 분석</CardTitle>
                    <CardDescription>기간에 따른 키워드의 검색량 추이입니다.</CardDescription>
                </CardHeader>
                <CardContent>
                   {seasonalData && seasonalData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <LineChart data={seasonalData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickFormatter={(tick) => format(new Date(tick), 'yy-MM-dd')} />
                                <YAxis />
                                <Tooltip labelFormatter={(label) => format(new Date(label), 'yyyy-MM-dd')} />
                                <Legend />
                                <Line type="monotone" dataKey="value" name="검색량" stroke="#8884d8" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                   ) : <div className="h-[400px] flex items-center justify-center bg-muted rounded-md"><p className="text-center text-muted-foreground">데이터 없음</p></div>}
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

