
'use client';

import * as React from 'react';
import { useInView } from 'react-intersection-observer';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import type { SearchResult } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';

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
    const [page, setPage] = React.useState(1);
    const [hasMore, setHasMore] = React.useState(true);
    const [isFetching, setIsFetching] = React.useState(false);
    const { ref, inView } = useInView({ threshold: 0.5 });
    
    const fetchPhotos = React.useCallback(async (currentQuery: string, currentPage: number) => {
        if (!currentQuery) return;
        setIsFetching(true);

        const pageSize = 12;
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        const newResults = Array.from({ length: pageSize }).map((_, i) => {
            const itemNum = (currentPage - 1) * pageSize + i;
            return {
                id: `photo_${currentQuery}_${itemNum}`,
                title: `사진: ${currentQuery} ${itemNum + 1}`,
                url: `https://picsum.photos/seed/${currentQuery}${itemNum}/800/600`,
                imageUrl: `https://picsum.photos/seed/${currentQuery}${itemNum}/400/225`,
                description: `"${currentQuery}"와(과) 관련된 고품질 이미지입니다.`,
                source: 'Picsum Photos',
            };
        });

        if (currentPage === 1) {
            setResults(newResults);
        } else {
            setResults(prev => [...prev, ...newResults]);
        }
        
        // Let's assume there are always more photos for this placeholder
        setHasMore(true); 
        setIsFetching(false);

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
