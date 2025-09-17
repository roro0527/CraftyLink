
'use client';

import * as React from 'react';
import axios from 'axios';
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

const GENDER_COLORS = ['#0088FE', '#FF8042'];
const AGE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
const KEYWORD_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#387908'];

// Mock-up 데이터 구조. 실제 API 응답에 맞게 조정됩니다.
const initialData = {
  genderAge: null,
  seasonal: null,
  multiKeyword: null,
  category: null,
  risingFalling: null,
};

const AnalysisPage = () => {
  const [data, setData] = React.useState(initialData);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const functionUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTION_URL;
        if (!functionUrl || functionUrl === 'http://your-function-url') {
            throw new Error("Firebase Function URL이 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_FIREBASE_FUNCTION_URL을 올바르게 설정해주세요.");
        }

        const [
            genderAgeRes,
            seasonalRes,
            multiKeywordRes,
            categoryRes,
            risingFallingRes
        ] = await Promise.all([
          axios.post(functionUrl, { type: 'genderAge', payload: { keyword: '노트북' } }),
          axios.post(functionUrl, { type: 'seasonal', payload: { keyword: '에어컨' } }),
          axios.post(functionUrl, { type: 'multiKeyword', payload: { keywords: ['갤럭시', '아이폰', '샤오미'] } }),
          axios.post(functionUrl, { type: 'category', payload: { categories: [{name: 'TV', param: ['50000001']}, {name: '냉장고', param: ['50000002']}] } }),
          axios.post(functionUrl, { type: 'risingFalling' }),
        ]);

        setData({
          genderAge: genderAgeRes.data,
          seasonal: seasonalRes.data,
          multiKeyword: multiKeywordRes.data,
          category: categoryRes.data,
          risingFalling: risingFallingRes.data,
        });
      } catch (err: any) {
        console.error("Error fetching analysis data:", err);
        setError(err.response?.data?.error || err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderGenderChart = () => {
    if (!data.genderAge || !data.genderAge.gender) return <div className="h-48 flex items-center justify-center bg-muted rounded-md"><p className="text-muted-foreground">데이터 없음</p></div>;
    const chartData = data.genderAge.gender.map((g: any) => ({ name: g.group === 'm' ? '남성' : '여성', value: g.ratio }));
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
    if (!data.genderAge || !data.genderAge.age) return <div className="h-48 flex items-center justify-center bg-muted rounded-md"><p className="text-muted-foreground">데이터 없음</p></div>;
    const chartData = data.genderAge.age.map((a: any) => ({ name: a.group.replace('s', '대'), value: a.ratio }));
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

  const renderLineChart = (chartData: any, dataKeys: string[], title: string) => {
    if (!chartData || chartData.length === 0) return <div className="h-72 flex items-center justify-center bg-muted rounded-md"><p className="text-muted-foreground">데이터 없음</p></div>;
    return (
      <>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            {dataKeys.map((key, index) => (
              <Line key={key} type="monotone" dataKey={key} stroke={KEYWORD_COLORS[index % KEYWORD_COLORS.length]} />
            ))}
          </LineChart>
        </ResponsiveContainer>
        {title === "시즌 패턴 분석" && <CardDescription className="text-center mt-2">네이버 데이터랩은 절대 검색량이 아닌 상대 지표를 제공합니다.</CardDescription>}
      </>
    );
  };

  const renderRisingFallingKeywords = () => {
      if (!data.risingFalling) return <div className="h-48 flex items-center justify-center bg-muted rounded-md"><p className="text-muted-foreground">데이터 없음</p></div>;
      const { rising, falling } = data.risingFalling;
      return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <h3 className="font-semibold mb-2 flex items-center"><TrendingUp className="mr-2 text-green-500" /> 급등 키워드 Top 3</h3>
                  <ul className="space-y-2">
                      {rising && rising.length > 0 ? rising.map((item: any, i: number) => (
                          <li key={i} className="flex justify-between items-center p-2 bg-muted rounded-md">
                              <span>{item.keyword}</span>
                              <Badge variant="default" className="bg-green-500 hover:bg-green-600">+{item.change.toFixed(1)}%</Badge>
                          </li>
                      )) : <p className="text-muted-foreground">급등 키워드가 없습니다.</p>}
                  </ul>
              </div>
              <div>
                  <h3 className="font-semibold mb-2 flex items-center"><TrendingDown className="mr-2 text-red-500" /> 급락 키워드 Top 3</h3>
                  <ul className="space-y-2">
                      {falling && falling.length > 0 ? falling.map((item: any, i: number) => (
                          <li key={i} className="flex justify-between items-center p-2 bg-muted rounded-md">
                              <span>{item.keyword}</span>
                              <Badge variant="destructive">{-item.change.toFixed(1)}%</Badge>
                          </li>
                      )) : <p className="text-muted-foreground">급락 키워드가 없습니다.</p>}
                  </ul>
              </div>
          </div>
      )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
              <CardContent><Skeleton className="h-64 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-20 bg-destructive/10 text-destructive rounded-lg">
          <h2 className="text-xl font-bold">오류 발생</h2>
          <p>{error}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center"><TrendingUp className="mr-2"/> 급등/급락 키워드</CardTitle>
            <CardDescription>전월 대비 검색량 변화율이 높은 키워드입니다.</CardDescription>
          </CardHeader>
          <CardContent>{renderRisingFallingKeywords()}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Users className="mr-2" /> '노트북' 성별/연령별 분석</CardTitle>
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
            <CardTitle className="flex items-center"><Calendar className="mr-2" /> '에어컨' 시즌 패턴 분석</CardTitle>
          </CardHeader>
          <CardContent>{renderLineChart(data.seasonal, ['ratio'], "시즌 패턴 분석")}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart2 className="mr-2" /> 다중 키워드 비교</CardTitle>
          </CardHeader>
          <CardContent>{renderLineChart(data.multiKeyword, ['갤럭시', '아이폰', '샤오미'], "다중 키워드")}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><PieChartIcon className="mr-2" /> 쇼핑 카테고리 비교</CardTitle>
          </CardHeader>
          <CardContent>{renderLineChart(data.category, ['TV', '냉장고'], "카테고리")}</CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">분석 결과 페이지</h1>
      </header>
      {renderContent()}
    </div>
  );
};

export default AnalysisPage;
