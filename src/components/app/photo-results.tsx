
'use client';

/**
 * @file '탐색' 페이지의 '사진' 탭 콘텐츠를 렌더링하는 컴포넌트입니다.
 * 검색어를 받아 구글 이미지 검색 API를 호출하고, 결과를 메이슨리(Masonry) 레이아웃으로 표시합니다.
 * 무한 스크롤 기능을 지원합니다.
 */

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import type { SearchResult } from '@/lib/types';
import { Terminal, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useInView } from 'react-intersection-observer';
import { useGetGoogleImages } from '@/hooks/use-get-google-images';

/**
 * 개별 이미지 검색 결과를 표시하는 내부 컴포넌트입니다.
 * 이미지 로딩 중 스켈레톤 UI를 보여주고, 로딩 실패 시 해당 아이템을 숨깁니다.
 */
const SearchResultItem: React.FC<{ item: SearchResult }> = ({ item }) => {
  const [isImageLoading, setIsImageLoading] = React.useState(true);
  const [isVisible, setIsVisible] = React.useState(true);

  // 이미지 로딩 실패 시 호출되는 에러 핸들러
  const handleImageError = () => {
    setIsVisible(false);
  };
  
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`relative break-inside-avoid-page group overflow-hidden rounded-lg animate-in fade-in-50 duration-500 ${!isVisible ? 'hidden' : ''}`}>
       {isImageLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
       <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
          {item.imageUrl && (
            <Image
              src={item.imageUrl}
              alt={item.title}
              width={500}
              height={500}
              className={`w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              unoptimized
              onLoad={() => setIsImageLoading(false)}
              onError={handleImageError}
            />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             <div className="absolute bottom-2 left-2 right-2">
                 <p className="text-xs text-white truncate">{item.source}</p>
             </div>
          </div>
      </a>
    </div>
  );
};


interface PhotoResultsProps {
    query: string; // 부모 컴포넌트로부터 받은 검색어
    setIsLoading: (isLoading: boolean) => void; // 로딩 상태를 부모에게 전달하는 함수
}

const PhotoResults: React.FC<PhotoResultsProps> = ({ query, setIsLoading }) => {
    // 무한 스크롤 구현을 위한 `react-intersection-observer` 훅
    const { ref, inView } = useInView({ threshold: 0.5 });
    // 구글 이미지 검색 로직을 담은 커스텀 훅
    const { results, isLoading, error, hasMore, loadMore } = useGetGoogleImages(query);
    
    /**
     * 내부 로딩 상태(isLoading)가 변경될 때마다 부모 컴포넌트의 로딩 상태를 업데이트합니다.
     */
    React.useEffect(() => {
      setIsLoading(isLoading);
    }, [isLoading, setIsLoading]);

    /**
     * 스크롤이 맨 아래로 내려가 ref 엘리먼트가 화면에 보이면(inView) 추가 데이터를 로드합니다.
     */
    React.useEffect(() => {
        if (inView && !isLoading && hasMore) {
            loadMore();
        }
    }, [inView, isLoading, hasMore, loadMore]);

    // 검색어가 없으면 아무것도 렌더링하지 않습니다.
    if (!query && results.length === 0) {
        return null;
    }
    
    // 초기 데이터 로딩 중일 때 스켈레톤 UI를 표시합니다.
    if (results.length === 0 && isLoading) {
        return (
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={`skel-photo-${i}`} className="h-64 w-full break-inside-avoid-page" />
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
     if (results.length === 0 && !isLoading) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>'{query}'에 대한 사진을 찾을 수 없습니다.</p>
            </div>
        );
    }
    
    // --- JSX 렌더링 (성공) ---
    return (
       <>
          {/* 메이슨리 레이아웃을 위한 컬럼 기반 스타일링 */}
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
            {results.map((item) => <SearchResultItem key={item.id} item={item} />)}
          </div>
          {/* 무한 스크롤 트리거 및 로딩 인디케이터 */}
           <div ref={ref} className="h-10 w-full mt-4 flex justify-center items-center">
                {isLoading && hasMore && <LoaderCircle className="h-6 w-6 animate-spin text-primary" />}
                {!hasMore && results.length > 0 && <p className="text-muted-foreground">더 이상 결과가 없습니다.</p>}
          </div>
        </>
    );
};

export default PhotoResults;
