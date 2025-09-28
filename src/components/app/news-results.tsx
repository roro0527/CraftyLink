
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getNaverNewsAction } from '@/app/actions';
import type { RelatedNewsData } from '@/ai/flows/naver-news-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';


interface NewsResultsProps {
    query: string;
    setIsParentLoading: (isLoading: boolean) => void;
}

const NewsResults: React.FC<NewsResultsProps> = ({ query, setIsParentLoading }) => {
    const [results, setResults] = React.useState<RelatedNewsData>([]);
    const [isFetching, setIsFetching] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchNews = async () => {
            if (!query) {
                setResults([]);
                return;
            };
            setIsFetching(true);
            setIsParentLoading(true);
            setError(null);
            try {
                const news = await getNaverNewsAction({ keyword: query });
                setResults(news);
            } catch (err) {
                console.error("Failed to fetch news", err);
                setError("뉴스 정보를 가져오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
            } finally {
                setIsFetching(false);
                setIsParentLoading(false);
            }
        };

        fetchNews();
    }, [query, setIsParentLoading]);

    if (!query) {
        return null;
    }
    
    if (isFetching) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={`skel-news-${i}`} className="p-4">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6 mt-1" />
                    </Card>
                ))}
            </div>
        );
    }
    
    if (error) {
        return (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>오류</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>관련 뉴스를 찾을 수 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {results.map((item, index) => (
                 <Card key={`${item.url}-${index}`} className="transition-shadow hover:shadow-lg">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block p-4">
                        <h3 className="font-semibold text-base line-clamp-2 hover:underline">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{item.summary}</p>
                        <p className="text-xs text-muted-foreground mt-2">네이버 뉴스</p>
                    </a>
                </Card>
            ))}
        </div>
    );
};

export default NewsResults;
