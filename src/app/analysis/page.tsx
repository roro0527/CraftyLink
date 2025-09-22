
'use client';

import * as React from 'react';
import {
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
import { Calendar, LoaderCircle, Search } from 'lucide-react';
import { format, subYears } from 'date-fns';
import { getKeywordTrendsAction } from '../actions';
import type { KeywordTrendPoint } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';


// Note: multiKeyword and category are temporarily mocked
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
};

const MULTI_KEYWORD_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#FF8042', '#0088FE'];

interface AnalysisData {
    trends: KeywordTrendPoint[] | null;
    multiKeyword: any;
    category: any;
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
                const trendsRes = await getKeywordTrendsAction({ keyword, timeRange: '1m' });

                setData({
                    trends: trendsRes,
                    multiKeyword: mockData.multiKeyword,
                    category: mockData.category,
                });
            } catch (error) {
                console.error("Error fetching analysis data:", error);
                toast({
                    variant: 'destructive',
                    title: '데이터 로딩 실패',
                    description: '분석 데이터를 가져오는 데 실패했습니다. 다시 시도해주세요.',
                });
                setData({
                    trends: null,
                    multiKeyword: mockData.multiKeyword,
                    category: mockData.category,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [keyword, toast]);


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
                {title === '검색량 추이 분석' && <CardDescription className="text-center mt-2">네이버 데이터랩은 절대 검색량이 아닌 상대 지표를 제공합니다.</CardDescription>}
            </>
        );
    };


    const renderContent = () => {
        if (loading) {
            return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className={i > 0 ? "lg:col-span-2" : ""}>
                            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
                            <CardContent><Skeleton className="h-64 w-full" /></CardContent>
                        </Card>
                    ))}
                </div>
            );
        }

        return (
            <div className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Calendar className="mr-2" /> 검색량 추이 분석</CardTitle>
                        <CardDescription>키워드: {keyword}</CardDescription>
                    </CardHeader>
                    <CardContent>{renderLineChart(data?.trends, '검색량 추이 분석')}</CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>다중 키워드 비교</CardTitle>
                    </CardHeader>
                    <CardContent>{renderLineChart(data?.multiKeyword, '다중 키워드 비교')}</CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>쇼핑 카테고리 비교</CardTitle>
                    </CardHeader>
                    <CardContent>{renderLineChart(data?.category, '쇼핑 카테고리 비교')}</CardContent>
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
