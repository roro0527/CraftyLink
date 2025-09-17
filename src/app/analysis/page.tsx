'use client';

import * as React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Calendar, BarChart2, PieChartIcon } from 'lucide-react';
import { getGenderAgeTrendAction, getSeasonalPatternAction } from '@/app/actions';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { addDays, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { GenderAgeTrendData, SeasonalPatternData } from '@/lib/types';


const GENDER_COLORS = ['#0088FE', '#FF8042'];
const AGE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const AnalysisPage = () => {
  const [keyword, setKeyword] = React.useState('노트북');
  const [date, setDate] = React.useState<any>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const [genderAgeData, setGenderAgeData] = React.useState<GenderAgeTrendData | null>(null);
  const [seasonalData, setSeasonalData] = React.useState<SeasonalPatternData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const fetchData = React.useCallback(async (currentKeyword: string, currentDate: any) => {
    if (!currentKeyword || !currentDate?.from || !currentDate?.to) {
      toast({ variant: 'destructive', title: '검색어와 기간을 모두 입력해주세요.'});
      return;
    }

    setLoading(true);
    setGenderAgeData(null);
    setSeasonalData(null);

    const startDate = format(currentDate.from, 'yyyy-MM-dd');
    const endDate = format(currentDate.to, 'yyyy-MM-dd');

    try {
      const [genderAgeRes, seasonalRes] = await Promise.all([
        getGenderAgeTrendAction({ keyword: currentKeyword, startDate, endDate }),
        getSeasonalPatternAction({ keyword: currentKeyword, startDate, endDate, timeUnit: 'month' }),
      ]);
      
      setGenderAgeData(genderAgeRes);
      setSeasonalData(seasonalRes);

    } catch (err: any) {
      console.error("Error fetching analysis data:", err);
      toast({
        variant: 'destructive',
        title: '데이터 분석 중 오류 발생',
        description: err.message || '데이터를 불러오는 중 오류가 발생했습니다.'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData(keyword, date);
  }, [fetchData, keyword, date]);

  const handleSearch = () => {
    fetchData(keyword, date);
  };

  const renderGenderChart = () => {
    if (!genderAgeData || !genderAgeData.genderGroups || genderAgeData.genderGroups.length === 0) return <div className="h-48 flex items-center justify-center bg-muted rounded-md"><p className="text-muted-foreground">데이터 없음</p></div>;
    const chartData = genderAgeData.genderGroups.map((g: any) => ({ name: g.group === 'm' ? '남성' : '여성', value: g.ratio }));
    return (
      <ResponsiveContainer width="100%" height={200}>
        <RechartsPieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {chartData.map((_entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    );
  };

  const renderAgeChart = () => {
    if (!genderAgeData || !genderAgeData.ageGroups || genderAgeData.ageGroups.length === 0) return <div className="h-48 flex items-center justify-center bg-muted rounded-md"><p className="text-muted-foreground">데이터 없음</p></div>;
    const chartData = genderAgeData.ageGroups.map((a: any) => ({ name: a.group.replace('s', '대'), value: a.ratio }));
    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
          <Bar dataKey="value">
            {chartData.map((_entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderSeasonalChart = () => {
    if (!seasonalData || seasonalData.length === 0) return <div className="h-72 flex items-center justify-center bg-muted rounded-md"><p className="text-muted-foreground">데이터 없음</p></div>;
    return (
      <>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={seasonalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" name="검색량" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
        <CardDescription className="text-center mt-2">네이버 데이터랩은 절대 검색량이 아닌 상대 지표를 제공합니다.</CardDescription>
      </>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent><Skeleton className="h-64 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2" /> 성별/연령별 분석</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-center mb-2">성별 비율</h3>
              {renderGenderChart()}
            </div>
            <div>
              <h3 className="font-semibold text-center mb-2">연령대별 관심도</h3>
              {renderAgeChart()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Calendar className="mr-2" /> 시즌 패턴 분석</CardTitle>
          </CardHeader>
          <CardContent>{renderSeasonalChart()}</CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">분석 결과 페이지</h1>
      </header>
       <Card className="mb-8">
          <CardHeader>
            <CardTitle>검색 조건</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-center gap-4">
            <Input 
              placeholder="키워드 입력" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="max-w-xs"
            />
            <DatePickerWithRange date={date} setDate={setDate} />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? '분석 중...' : '분석하기'}
            </Button>
          </CardContent>
        </Card>

      {renderContent()}
    </div>
  );
};

export default AnalysisPage;
