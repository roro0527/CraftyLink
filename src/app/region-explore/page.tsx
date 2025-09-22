
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoaderCircle, Search, MapPin, Crown, Globe, Youtube, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getKeywordRegionRankAction, getRegionalTrendsAction } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import RegionMap from '@/components/app/region-map';
import regionsData from '@/lib/korea-regions.geo.json';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { RegionalTrendsOutput } from '@/ai/flows/regional-trends-flow';
import { format, parseISO } from 'date-fns';

type RegionRank = {
    geoName?: string;
    value?: number;
};

type Country = {
    code: string;
    name: string;
};

const countries: Country[] = [
    { code: 'US', name: '미국' },
    { code: 'JP', name: '일본' },
    { code: 'VN', name: '베트남' },
    { code: 'GB', name: '영국' },
];

export default function RegionExplorePage() {
    const { toast } = useToast();
    const [keyword, setKeyword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [topRegions, setTopRegions] = React.useState<RegionRank[]>([]);
    const [bounds, setBounds] = React.useState<any>(null);
    const [selectedCountry, setSelectedCountry] = React.useState<Country>(countries[0]);
    const [globalTrends, setGlobalTrends] = React.useState<RegionalTrendsOutput | null>(null);
    const [isGlobalLoading, setIsGlobalLoading] = React.useState(false);

    const handleSearch = async () => {
        if (!keyword.trim()) {
            toast({ variant: 'destructive', title: '검색어를 입력해주세요.' });
            return;
        }
        setIsLoading(true);
        setIsGlobalLoading(true);
        setTopRegions([]);
        setBounds(null);
        setGlobalTrends(null);

        try {
            const [regionResult, globalResult] = await Promise.all([
                getKeywordRegionRankAction({ keyword }),
                getRegionalTrendsAction({ keyword, region: selectedCountry.code, countryName: selectedCountry.name })
            ]);

            // Region Rank processing
            if (regionResult.length === 0) {
                toast({ variant: "default", title: "지역 데이터 없음", description: `'${keyword}'에 대한 지역별 관심도 데이터가 없습니다.` });
            }
            setTopRegions(regionResult);

            if (regionResult.length > 0 && regionResult[0].geoName) {
                const topRegionName = regionResult[0].geoName;
                const regionFeature = regionsData.features.find(f => f.properties.nm === topRegionName);
                if (regionFeature) {
                    const coords = regionFeature.geometry.coordinates[0];
                    if (window.kakao && window.kakao.maps) {
                       const path = coords.map(c => new window.kakao.maps.LatLng(c[1], c[0]));
                       const newBounds = new window.kakao.maps.LatLngBounds();
                       path.forEach(p => newBounds.extend(p));
                       setBounds(newBounds);
                    }
                }
            }
            
            // Global Trends processing
            setGlobalTrends(globalResult);

        } catch (error) {
            console.error("Error during region rank search:", error);
            toast({ variant: "destructive", title: "분석 중 오류 발생", description: "데이터를 가져오는 데 실패했습니다." });
        } finally {
            setIsLoading(false);
            setIsGlobalLoading(false);
        }
    };

    const handleVideoClick = (videoId: string) => {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">지역별 & 글로벌 관심도 탐색</h1>
                <p className="text-muted-foreground">키워드의 지역별 쇼핑 관심도와 국가별 트렌드를 확인합니다.</p>
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
                 <Select
                    value={selectedCountry.code}
                    onValueChange={(value) => setSelectedCountry(countries.find(c => c.code === value) || countries[0])}
                >
                    <SelectTrigger className="w-full md:w-[180px] h-11">
                        <SelectValue placeholder="국가 선택" />
                    </SelectTrigger>
                    <SelectContent>
                        {countries.map(country => (
                            <SelectItem key={country.code} value={country.code}>
                                {country.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button onClick={handleSearch} disabled={isLoading || isGlobalLoading} className="h-11">
                    {isLoading || isGlobalLoading ? <LoaderCircle className="animate-spin" /> : <Search />}
                    <span className="ml-2">탐색하기</span>
                </Button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center"><MapPin className="mr-2" /> 최고 관심 그룹 (대한민국)</CardTitle>
                        <CardDescription>관심도가 가장 높은 상위 3개 지역입니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : topRegions.length > 0 ? (
                            <ul className="space-y-3">
                                {topRegions.map((region, index) => (
                                    <li key={index} className={`p-3 rounded-lg flex items-center justify-between ${index === 0 ? 'bg-primary/10 border border-primary' : 'bg-muted'}`}>
                                        <div className="flex items-center font-semibold">
                                            {index === 0 && <Crown className="w-5 h-5 mr-2 text-yellow-500" />}
                                            <span className="text-lg">{index + 1}. {region.geoName}</span>
                                        </div>
                                        <span className="font-bold text-primary">{region.value?.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-muted-foreground">
                                <p>검색 결과가 없습니다.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card className="md:col-span-2 h-[400px] md:h-auto">
                     <RegionMap center={[36.5, 127.5]} zoom={10} bounds={bounds} />
                </Card>
            </div>

            <div className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center"><Globe className="mr-2" /> 글로벌 탐색 결과 ({selectedCountry.name})</CardTitle>
                        <CardDescription>'{keyword}' 키워드에 대한 {selectedCountry.name}의 연관 트렌드입니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isGlobalLoading ? (
                            <div className="space-y-6">
                                <div>
                                    <Skeleton className="h-6 w-32 mb-4" />
                                    <div className="flex flex-wrap gap-2">
                                        <Skeleton className="h-8 w-24" />
                                        <Skeleton className="h-8 w-28" />
                                        <Skeleton className="h-8 w-20" />
                                    </div>
                                </div>
                                <div>
                                    <Skeleton className="h-6 w-32 mb-4" />
                                    <Skeleton className="h-40 w-full" />
                                </div>
                            </div>
                        ) : globalTrends ? (
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center mb-3"><Tag className="mr-2"/> 연관 검색어</h3>
                                    {globalTrends.relatedKeywords.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {globalTrends.relatedKeywords.map((tag, i) => (
                                                <Badge key={i} variant="secondary" className="text-base">{tag}</Badge>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">연관 검색어가 없습니다.</p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center mb-3"><Youtube className="mr-2"/> 관련 영상</h3>
                                    {globalTrends.relatedVideos.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>제목</TableHead>
                                                    <TableHead>채널</TableHead>
                                                    <TableHead>업로드</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {globalTrends.relatedVideos.map((video) => (
                                                    <TableRow 
                                                        key={video.id} 
                                                        className="cursor-pointer hover:bg-muted/50"
                                                        onClick={() => handleVideoClick(video.id)}
                                                    >
                                                        <TableCell className="font-medium max-w-xs truncate">{video.title}</TableCell>
                                                        <TableCell>{video.channelTitle}</TableCell>
                                                        <TableCell>{format(parseISO(video.publishedAt), 'yyyy-MM-dd')}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">관련 영상이 없습니다.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                             <div className="h-48 flex items-center justify-center text-muted-foreground">
                                <p>키워드를 검색하여 글로벌 트렌드를 확인하세요.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
