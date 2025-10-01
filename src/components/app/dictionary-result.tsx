
'use client';

/**
 * @file '탐색' 페이지의 '사전' 탭 콘텐츠를 렌더링하는 컴포넌트입니다.
 * 검색어를 받아 사전 API를 호출하고 결과를 표시합니다.
 */

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getDictionaryEntryAction } from '@/app/actions';
import type { DictionaryEntry } from '@/ai/flows/dictionary-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Pin, MessageSquareQuote, Pilcrow } from 'lucide-react';

interface DictionaryResultProps {
    query: string; // 부모 컴포넌트로부터 받은 검색어
}

const DictionaryResult: React.FC<DictionaryResultProps> = ({ query }) => {
    // --- State 정의 ---
    const [result, setResult] = React.useState<DictionaryEntry | null>(null); // API 결과
    const [isFetching, setIsFetching] = React.useState(false); // 내부 로딩 상태
    const [error, setError] = React.useState<string | null>(null); // 에러 상태

    /**
     * query prop이 변경될 때마다 사전 검색 액션을 호출합니다.
     */
    React.useEffect(() => {
        const fetchEntry = async () => {
            if (!query) {
                setResult(null);
                return;
            };
            setIsFetching(true);
            setError(null);
            try {
                const entry = await getDictionaryEntryAction({ keyword: query });
                setResult(entry);
            } catch (err) {
                console.error("Failed to fetch dictionary entry", err);
                setError("사전 정보를 생성하는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
            } finally {
                setIsFetching(false);
            }
        };

        fetchEntry();
    }, [query]);

    // 검색어가 없으면 아무것도 렌더링하지 않습니다.
    if (!query) {
        return null;
    }
    
    // 로딩 중일 때 스켈레톤 UI를 표시합니다.
    if (isFetching) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-5/6" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-full" />
                         <Skeleton className="h-5 w-full" />
                    </div>
                </CardContent>
            </Card>
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

    // 결과가 없거나 API가 에러를 반환했을 경우 메시지를 표시합니다.
    if (!result || result.definition.startsWith('오류')) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>'{query}'에 대한 사전 정보를 찾을 수 없습니다.</p>
            </div>
        );
    }

    // --- JSX 렌더링 (성공) ---
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold">{result.word}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2 text-lg"><Pin className="h-5 w-5 text-primary"/>정의</h3>
                    <p className="text-muted-foreground leading-relaxed">{result.definition}</p>
                </div>

                {result.etymology && (
                    <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2 text-lg"><Pilcrow className="h-5 w-5 text-primary"/>어원</h3>
                        <p className="text-muted-foreground leading-relaxed">{result.etymology}</p>
                    </div>
                )}
                
                {result.examples && result.examples.length > 0 && (
                     <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2 text-lg"><MessageSquareQuote className="h-5 w-5 text-primary"/>예문</h3>
                        <ul className="space-y-2 list-inside">
                           {result.examples.map((ex, i) => (
                               <li key={i} className="text-muted-foreground leading-relaxed pl-4 border-l-2 border-primary/50">
                                   "{ex}"
                               </li>
                           ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default DictionaryResult;
