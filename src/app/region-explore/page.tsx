
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoaderCircle, Search, MapPin, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getKeywordRegionRankAction } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';
import RegionMap from '@/components/app/region-map';
import regionsData from '@/lib/korea-regions.geo.json';

type RegionRank = {
    geoName?: string;
    value?: number;
};

export default function RegionExplorePage() {
    const { toast } = useToast();
    const [keyword, setKeyword] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [topRegions, setTopRegions] = React.useState<RegionRank[]>([]);
    const [bounds, setBounds] = React.useState<any>(null);

    const handleSearch = async () => {
        if (!keyword.trim()) {
            toast({ variant: 'destructive', title: '검색어를 입력해주세요.' });
            return;
        }
        setIsLoading(true);
        setTopRegions([]);
        setBounds(null);

        try {
            const result = await getKeywordRegionRankAction({ keyword });
            if (result.length === 0) {
                toast({ variant: "default", title: "데이터 없음", description: `'${keyword}'에 대한 지역별 관심도 데이터가 없습니다.` });
            }
            setTopRegions(result);

            if (result.length > 0 && result[0].geoName) {
                const topRegionName = result[0].geoName;
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

        } catch (error) {
            console.error("Error during region rank search:", error);
            toast({ variant: "destructive", title: "분석 중 오류 발생", description: "데이터를 가져오는 데 실패했습니다." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">지역별 관심도 탐색</h1>
                <p className="text-muted-foreground">키워드의 지역별 쇼핑 관심도 순위를 확인합니다.</p>
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
                <Button onClick={handleSearch} disabled={isLoading} className="h-11">
                    {isLoading ? <LoaderCircle className="animate-spin" /> : <Search />}
                    <span className="ml-2">탐색하기</span>
                </Button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center"><MapPin className="mr-2" /> 최고 관심 그룹</CardTitle>
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
        </div>
    );
}
