
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import type { SearchResult } from '@/lib/types';
import { Terminal, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useInView } from 'react-intersection-observer';
import { useGetGoogleImages } from '@/hooks/use-get-google-images';


const SearchResultItem: React.FC<{ item: SearchResult }> = ({ item }) => {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg group">
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block relative">
        {item.imageUrl && (
          <div className="aspect-square overflow-hidden bg-muted">
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              unoptimized 
            />
          </div>
        )}
        {item.source && (
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                 <p className="text-xs text-white truncate">{item.source}</p>
            </div>
        )}
      </a>
    </Card>
  );
};


interface PhotoResultsProps {
    query: string;
}

const PhotoResults: React.FC<PhotoResultsProps> = ({ query }) => {
    const { ref, inView } = useInView({ threshold: 0.5 });
    const { results, isLoading, error, hasMore, loadMore } = useGetGoogleImages(query);
    
    // Effect for infinite scrolling
    React.useEffect(() => {
        if (inView && !isLoading && hasMore) {
            loadMore();
        }
    }, [inView, isLoading, hasMore, loadMore]);


    if (!query && results.length === 0) {
        return null;
    }
    
    if (results.length === 0 && isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <Card key={`skel-photo-${i}`}>
                        <Skeleton className="aspect-square w-full" />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map((item) => <SearchResultItem key={item.id} item={item} />)}
          </div>
           <div ref={ref} className="h-10 w-full mt-4 flex justify-center items-center">
                {isLoading && hasMore && <LoaderCircle className="h-6 w-6 animate-spin text-primary" />}
                {!hasMore && results.length > 0 && <p className="text-muted-foreground">더 이상 결과가 없습니다.</p>}
          </div>
        </>
    );
};

export default PhotoResults;
