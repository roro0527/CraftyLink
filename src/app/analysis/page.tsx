
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
import { TrendingUp, Users, Calendar, TrendingDown, Search, LoaderCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, subYears } from 'date-fns';
import { getGenderAgeTrendAction, getSeasonalPatternAction } from '../actions';
import type { GenderAgeTrendData, SeasonalPatternData } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';


const GENDER_COLORS = ['#0088FE', '#FF8042'];
const AGE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

// Note: multiKeyword, category, and risingFalling are temporarily mocked
// as there are no corresponding server actions implemented yet.
const mockData = {
    multiKeyword: {
        '갤럭시': [{ date: '2023-12-01', value: 70 }, { date: '2023-12-02', value: 72 }],
        '아이폰': [{ date: '2023-12-01', value: 80 }, { date: '2023-12-02', value: 85 }],
        '샤오미': [{ date: '2023-12-01', value: 20 }, { date: '2023-12-02', value: 22 }],
    },
    category: {
        'TV': [{ date: '2023-12-01', value: 50 }, { date: '2023-12-02', value: 55 }],
        '냉장고': [{ date: '2023-12-01', value: 40 }, { date: '2023-12-02', value: 42 }],
        '에어컨': [{ date: '2023-12-01', value: 10 }, { date: '2023-12-02', value: 12 }],
    },
    risingFalling: {
        rising: [{ keyword: '패딩', change: '+50%' }, { keyword: '크리스마스 트리', change: '+120%' }, { keyword: '스키 장비', change: '+80%' }],
        falling: [{ keyword: '선풍기', change: '-70%' }, { keyword: '수영복', change: '-90%' }, { keyword: '캠핑 의자', change: '-60%' }],
    }
};

const MULTI_KEYWORD_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#FF8042', '#0088FE'];

interface AnalysisData {
    genderAge: GenderAgeTrendData | null;
    seasonal: SeasonalPatternData | null;
    multiKeyword: any;
    category: any;
    risingFalling: any;
}


const AnalysisPage = () => {
    const { toast } = useToast();
    const [data, setData] = React.useState<AnalysisData | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [keyword, setKeyword] = React.useState('노트북');
    const [inputValue, setInputValue] = React.useState('노트북');

    const handleSearch = () => {
        if (!inputValue.trim()) {
            toast({
                variant: 'destructive',
                title: '검색어를 입력해주세요.',
            });
            return;
        }
        setKeyword(inputValue);
    };

    React.useEffect(() => {
        const fetchData = async () => {
            if (!keyword) return;

            setLoading(true);
            
            try {
                const endDate = new Date();
                const startDate = subYears(endDate, 1);
                const formattedStartDate = format(startDate, 'yyyy-MM-dd');
                const formattedEndDate = format(endDate, 'yyyy-MM-dd');

                const [
                    genderAgeRes,
                    seasonalRes,
                ] = await Promise.all([
                    getGenderAgeTrendAction({ keyword, startDate: formattedStartDate, endDate: formattedEndDate }),
                    getSeasonalPatternAction({ keyword, startDate: formattedStartDate, endDate: formattedEndDate, timeUnit: 'month' })
                ]);

                setData({
                    genderAge: genderAgeRes,
                    seasonal: seasonalRes,
                    multiKeyword: mockData.multiKeyword,
                    category: mockData.category,
                    risingFalling: mockData.risingFalling
                });
            } catch (error) {
                console.error("Error fetching analysis data:", error);
                toast({
                    variant: 'destructive',
                    title: '데이터 로딩 실패',
                    description: '분석 데이터를 가져오는 데 실패했습니다. 다시 시도해주세요.',
                });
                setData({
                    genderAge: null,
                    seasonal: null,
                    multiKeyword: mockData.multiKeyword,
                    category: mockData.category,
                    risingFalling: mockData.risingFalling
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [keyword, toast]);

    const renderGenderChart = () => {
        if (!data?.genderAge?.genderGroups || data.genderAge.genderGroups.length === 0) return <div className="h-48 flex items-center justify-center bg-muted rounded-md"><p className="text-muted-foreground">데이터 없음</p></div>;
        const chartData = data.genderAge.genderGroups.map((g: any) => ({ name: g.group === 'm' ? '남성' : '여성', value: g.ratio }));
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
        if (!data?.genderAge?.ageGroups || data.genderAge.ageGroups.length === 0) return <div className="h-48 flex items-center justify-center bg-muted rounded-md"><p className="text-muted-foreground">데이터 없음</p></div>;
        const chartData = data.genderAge.ageGroups.map((a: any) => ({ name: a.group.replace('s', '대'), value: a.ratio }));
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

    const renderLineChart = (chartData: any, title: string) => {
        if (!chartData || (Array.isArray(chartData) && chartData.length === 0)) return <div className="h-72 flex items-center justify-center bg-muted rounded-md"><p className="text-muted-foreground">데이터 없음</p></div>;

        const isMulti = !Array.isArray(chartData);
        const keys = isMulti ? Object.keys(chartData) : ['value'];

        let formattedData: any[] = [];
        if (isMulti) {
            const dateMap = new Map();
            keys.forEach(key => {
                chartData[key].forEach((point: any) => {
                    if (!dateMap.has(point.date)) dateMap.set(point.date, { date: point.date });
                    dateMap.get(point.date)[key] = point.value;
                });
            });
            formattedData = Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } else {
            formattedData = chartData;
        }

        return (
            <>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={formattedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {keys.map((key, index) => (
                            <Line key={key} type="monotone" dataKey={key} name={key} stroke={MULTI_KEYWORD_COLORS[index % MULTI_KEYWORD_COLORS.length]} />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
                {title === '시즌 패턴 분석' && <CardDescription className="text-center mt-2">네이버 데이터랩은 절대 검색량이 아닌 상대 지표를 제공합니다.</CardDescription>}
            </>
        );
    };

    const renderRisingFallingKeywords = () => {
        if (!data?.risingFalling) return <div className="h-40 flex items-center justify-center bg-muted rounded-md"><p className="text-muted-foreground">데이터 없음</p></div>;
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center"><TrendingUp className="mr-2 text-green-500"/> 급등 키워드 Top 3</h3>
                    <ul className="space-y-2">
                        {data.risingFalling.rising.map((item: any, i: number) => (
                            <li key={i} className="flex justify-between items-center bg-muted p-2 rounded-md">
                                <span>{i + 1}. {item.keyword}</span>
                                <Badge variant="default" className="bg-green-500">{item.change}</Badge>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center"><TrendingDown className="mr-2 text-red-500"/> 급락 키워드 Top 3</h3>
                    <ul className="space-y-2">
                        {data.risingFalling.falling.map((item: any, i: number) => (
                             <li key={i} className="flex justify-between items-center bg-muted p-2 rounded-md">
                                <span>{i + 1}. {item.keyword}</span>
                                <Badge variant="destructive">{item.change}</Badge>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }


    const renderContent = () => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className={i > 3 ? "lg:col-span-2" : ""}>
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
                        <CardDescription>키워드: {keyword}</CardDescription>
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
                        <CardDescription>키워드: {keyword}</CardDescription>
                    </CardHeader>
                    <CardContent>{renderLineChart(data?.seasonal, '시즌 패턴 분석')}</CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>다중 키워드 비교</CardTitle>
                    </CardHeader>
                    <CardContent>{renderLineChart(data?.multiKeyword, '다중 키워드 비교')}</CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>쇼핑 카테고리 비교</CardTitle>
                    </CardHeader>
                    <CardContent>{renderLineChart(data?.category, '쇼핑 카테고리 비교')}</CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center"><TrendingUp className="mr-2"/> 급등/급락 키워드</CardTitle>
                        <CardDescription>전월 대비 쇼핑 카테고리 인기 검색어 순위 변화</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {renderRisingFallingKeywords()}
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">분석 결과 페이지</h1>
            </header>
            
            <div className="flex w-full max-w-sm items-center space-x-2 mb-8">
                <Input
                    type="text"
                    placeholder="키워드 입력..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    disabled={loading}
                />
                <Button onClick={handleSearch} disabled={loading}>
                    {loading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    검색
                </Button>
            </div>

            {renderContent()}
        </div>
    );
};

export default AnalysisPage;
