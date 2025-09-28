
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import type { SearchResult } from '@/lib/types';
import { Terminal, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useInView } from 'react-intersection-observer';
import axios from 'axios';


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
              unoptimized // Use this if you have many different image domains
            />
          </div>
        )}
        <CardContent className="p-4">
          <h3 className="font-semibold text-base line-clamp-2">{item.title}</h3>
          {item.description && (
             <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{item.description}</p>
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
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [startIndex, setStartIndex] = React.useState(1);
    const [hasMore, setHasMore] = React.useState(true);
    const { ref, inView } = useInView({ threshold: 0.5 });
    
    const fetchPhotos = React.useCallback(async (currentQuery: string, start: number) => {
        if (!currentQuery) return;
        
        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get('/api/getGoogleImages', {
                params: { query: currentQuery, start: start },
            });
            const { photos, nextPage } = response.data;
            
            if (start === 1) {
                setResults(photos);
            } else {
                 setResults(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const newPhotos = photos.filter((p: SearchResult) => !existingIds.has(p.id));
                    return [...prev, ...newPhotos];
                });
            }

            if (nextPage) {
                setStartIndex(nextPage);
                setHasMore(true);
            } else {
                setHasMore(false);
            }

        } catch (err) {
            console.error("Failed to fetch images", err);
            setError("이미지를 불러오는 데 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Effect to fetch initial data or when query changes
    React.useEffect(() => {
        if (query) {
            setResults([]);
            setStartIndex(1);
            setHasMore(true);
            fetchPhotos(query, 1);
        }
    }, [query, fetchPhotos]);

     // Effect for infinite scrolling
    React.useEffect(() => {
        if (inView && !isLoading && hasMore && query) {
            fetchPhotos(query, startIndex);
        }
    }, [inView, isLoading, hasMore, query, startIndex, fetchPhotos]);


    if (!query && results.length === 0) {
        return null;
    }
    
    if (results.length === 0 && isLoading) {
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

     if (results.length === 0 && !isLoading) {
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
                {isLoading && <LoaderCircle className="h-6 w-6 animate-spin text-primary" />}
                {!hasMore && results.length > 0 && <p className="text-muted-foreground">더 이상 결과가 없습니다.</p>}
          </div>
        </>
    );
};

export default PhotoResults;
