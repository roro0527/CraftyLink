
'use client';

/**
 * @file '탐색' 페이지의 '뉴스' 탭 콘텐츠를 렌더링하는 컴포넌트입니다.
 * 검색어를 받아 네이버 뉴스 API를 호출하고 결과 목록을 표시합니다.
 */

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getNaverNewsAction } from '@/app/actions';
import type { RelatedNewsData } from '@/ai/flows/naver-news-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

interface NewsResultsProps {
    query: string; // 부모 컴포넌트로부터 받은 검색어
    setIsParentLoading: (isLoading: boolean) => void; // 로딩 상태를 부모에게 전달하는 함수
}

const NewsResults: React.FC<NewsResultsProps> = ({ query, setIsParentLoading }) => {
    // --- State 정의 ---
    const [results, setResults] = React.useState<RelatedNewsData>([]); // API 결과
    const [isFetching, setIsFetching] = React.useState(false); // 내부 로딩 상태
    const [error, setError] = React.useState<string | null>(null); // 에러 상태

    /**
     * query prop이 변경될 때마다 뉴스 검색 액션을 호출합니다.
     */
    React.useEffect(() => {
        const fetchNews = async () => {
            if (!query) {
                setResults([]);
                return;
            };
            setIsFetching(true);
            setIsParentLoading(true); // 부모 컴포넌트에 로딩 시작 알림
            setError(null);
            try {
                const news = await getNaverNewsAction({ keyword: query });
                setResults(news);
            } catch (err) {
                console.error("Failed to fetch news", err);
                setError("뉴스 정보를 가져오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
            } finally {
                setIsFetching(false);
                setIsParentLoading(false); // 부모 컴포넌트에 로딩 종료 알림
            }
        };

        fetchNews();
    }, [query, setIsParentLoading]);

    // 검색어가 없으면 아무것도 렌더링하지 않습니다.
    if (!query) {
        return null;
    }
    
    // 로딩 중일 때 스켈레톤 UI를 표시합니다.
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
    
    // 에러 발생 시 에러 메시지를 표시합니다.
    if (error) {
        return (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>오류</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    // 결과가 없을 경우 메시지를 표시합니다.
    if (results.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>관련 뉴스를 찾을 수 없습니다.</p>
            </div>
        );
    }

    // --- JSX 렌더링 (성공) ---
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
