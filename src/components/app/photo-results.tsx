
'use client';

import * as React from 'react';
import { useInView } from 'react-intersection-observer';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import type { SearchResult } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';
import axios from 'axios';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';


const SearchResultItem: React.FC<{ item: SearchResult }> = ({ item }) => {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        {item.imageUrl && (
          <div className="aspect-video overflow-hidden bg-muted">
            <Image
              src={item.imageUrl}
              alt={item.title}
              width={400}
              height={225}
              className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
        <CardContent className="p-4">
          <h3 className="font-semibold text-base line-clamp-2">{item.title}</h3>
          {item.description && (
             <a href={item.photographer_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-sm text-muted-foreground mt-1 line-clamp-3 hover:underline">{item.description}</a>
          )}
          {item.source && (
            <p className="text-xs text-muted-foreground mt-2">{item.source}</p>
          )}
        </CardContent>
      </a>
    </Card>
  );
};


interface PhotoResultsProps {
    query: string;
}

const PhotoResults: React.FC<PhotoResultsProps> = ({ query }) => {
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [page, setPage] = React.useState(1);
    const [hasMore, setHasMore] = React.useState(true);
    const [isFetching, setIsFetching] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const { ref, inView } = useInView({ threshold: 0.5 });
    
    const fetchPhotos = React.useCallback(async (currentQuery: string, currentPage: number) => {
        if (!currentQuery) return;
        setIsFetching(true);
        setError(null);

        try {
            const response = await axios.get('/api/getPexelsPhotos', {
                params: { query: currentQuery, page: currentPage },
            });
            const { photos, hasMore: apiHasMore } = response.data;
            
            if (currentPage === 1) {
                setResults(photos);
            } else {
                setResults(prev => [...prev, ...photos]);
            }
            setHasMore(apiHasMore);

        } catch (err) {
            console.error(err);
            setError('사진을 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsFetching(false);
        }

    }, []);
    
    // Effect to fetch initial data or when query changes
    React.useEffect(() => {
        if (query) {
            setPage(1);
            setHasMore(true);
            setResults([]);
            fetchPhotos(query, 1);
        }
    }, [query, fetchPhotos]);

    // Effect for infinite scrolling
    React.useEffect(() => {
        if (inView && !isFetching && hasMore && query) {
            setPage(prevPage => {
                const nextPage = prevPage + 1;
                fetchPhotos(query, nextPage);
                return nextPage;
            });
        }
    }, [inView, isFetching, hasMore, query, fetchPhotos]);


    if (!query && results.length === 0) {
        return null;
    }
    
    if (results.length === 0 && isFetching) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Card key={`skel-photo-${i}`}>
                        <Skeleton className="aspect-video w-full" />
                        <CardContent className="p-4">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full" />
                        </CardContent>
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

     if (results.length === 0 && !isFetching) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>'{query}'에 대한 사진을 찾을 수 없습니다.</p>
            </div>
        );
    }
    
    return (
       <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map((item) => <SearchResultItem key={item.id} item={item} />)}
          </div>
          <div ref={ref} className="h-10 w-full mt-4 flex justify-center items-center">
            {isFetching && page > 1 && <LoaderCircle className="h-6 w-6 animate-spin text-primary" />}
            {!hasMore && results.length > 0 && <p className="text-muted-foreground">더 이상 결과가 없습니다.</p>}
          </div>
        </>
    );
};

export default PhotoResults;
