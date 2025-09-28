
'use client';

/**
 * @file '탐색' 페이지의 '동영상' 탭 콘텐츠를 렌더링하는 컴포넌트입니다.
 * 검색어를 받아 유튜브 동영상 검색 API를 호출하고, 결과를 카드 형태로 표시합니다.
 * 무한 스크롤 기능을 지원합니다.
 */

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { getYoutubeVideosAction } from '@/app/actions';
import type { YoutubeVideo } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoaderCircle, Terminal } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

interface VideoResultsProps {
    query: string; // 부모 컴포넌트로부터 받은 검색어
    setIsParentLoading: (isLoading: boolean) => void; // 로딩 상태를 부모에게 전달하는 함수
}

const VideoResults: React.FC<VideoResultsProps> = ({ query, setIsParentLoading }) => {
    // --- State 정의 ---
    const [results, setResults] = React.useState<YoutubeVideo[]>([]); // API 결과 목록
    const [nextPageToken, setNextPageToken] = React.useState<string | null | undefined>(undefined); // 다음 페이지 토큰
    const [hasMore, setHasMore] = React.useState(true); // 추가 데이터 존재 여부
    const [isFetching, setIsFetching] = React.useState(false); // 내부 로딩 상태
    const [error, setError] = React.useState<string | null>(null); // 에러 상태
    
    // 무한 스크롤 구현을 위한 `react-intersection-observer` 훅
    const { ref, inView } = useInView({ threshold: 0.5 });

    /**
     * 동영상 검색 액션을 호출하여 데이터를 가져오는 함수.
     * useCallback으로 메모이제이션하여 불필요한 함수 재생성을 방지합니다.
     * @param currentQuery 현재 검색어
     * @param pageToken 다음 페이지를 가져오기 위한 토큰
     */
    const fetchVideos = React.useCallback(async (currentQuery: string, pageToken?: string | null) => {
        if (!currentQuery) return;
        
        setIsFetching(true);
        if(!pageToken) setIsParentLoading(true); // 초기 로딩 시에만 부모 로딩 상태 변경
        setError(null);

        try {
            const response = await getYoutubeVideosAction({ keyword: currentQuery, pageToken: pageToken || undefined });
            
            setResults(prev => {
                const existingIds = new Set(prev.map(v => v.id));
                const newVideos = response.videos.filter(v => !existingIds.has(v.id)); // 중복 제거
                return pageToken ? [...prev, ...newVideos] : response.videos; // 페이지 토큰이 있으면 추가, 없으면 새로 설정
            });

            setNextPageToken(response.nextPageToken);
            setHasMore(!!response.nextPageToken);

        } catch (err) {
            console.error("Failed to fetch videos", err);
            setError("동영상 정보를 가져오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setIsFetching(false);
            if(!pageToken) setIsParentLoading(false); // 초기 로딩 종료 시 부모 로딩 상태 변경
        }
    }, [setIsParentLoading]);

    /**
     * query prop이 변경되면 비디오 목록을 초기화하고 첫 페이지를 가져옵니다.
     */
    React.useEffect(() => {
        if (query) {
            setResults([]);
            setNextPageToken(undefined);
            setHasMore(true);
            fetchVideos(query);
        }
    }, [query, fetchVideos]);

    /**
     * 스크롤이 맨 아래로 내려가 ref 엘리먼트가 화면에 보이면(inView) 추가 데이터를 로드합니다.
     */
    React.useEffect(() => {
        if (inView && !isFetching && hasMore && query && nextPageToken !== undefined) {
            fetchVideos(query, nextPageToken);
        }
    }, [inView, isFetching, hasMore, query, nextPageToken, fetchVideos]);

    // 검색어가 없으면 아무것도 렌더링하지 않습니다.
    if (!query) {
        return null;
    }

    // 초기 데이터 로딩 중일 때 스켈레톤 UI를 표시합니다.
    if (results.length === 0 && isFetching) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={`skel-video-${i}`}>
                        <Skeleton className="aspect-video w-full" />
                        <CardContent className="p-4">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                        </CardContent>
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

    // 결과가 없고 로딩도 끝나면 '결과 없음' 메시지를 표시합니다.
    if (results.length === 0 && !isFetching) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>관련 동영상을 찾을 수 없습니다.</p>
            </div>
        );
    }

    // --- JSX 렌더링 (성공) ---
    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((v) => (
                    <Card key={v.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                        <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer">
                            <div className="aspect-video overflow-hidden bg-muted">
                            <Image
                                src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`}
                                alt={v.title}
                                width={400}
                                height={225}
                                className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
                                unoptimized
                            />
                            </div>
                            <CardContent className="p-4">
                                <h3 className="font-semibold text-base line-clamp-2">{v.title}</h3>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{v.channelTitle}</p>
                                <p className="text-xs text-muted-foreground mt-1">조회수 {parseInt(v.viewCount, 10).toLocaleString()}회</p>
                            </CardContent>
                        </a>
                    </Card>
                ))}
            </div>
            {/* 무한 스크롤 트리거 및 로딩 인디케이터 */}
            <div ref={ref} className="h-10 w-full mt-4 flex justify-center items-center">
                {isFetching && hasMore && <LoaderCircle className="h-6 w-6 animate-spin text-primary" />}
                {!hasMore && results.length > 0 && <p className="text-muted-foreground">더 이상 결과가 없습니다.</p>}
          </div>
      </>
    );
};

export default VideoResults;
