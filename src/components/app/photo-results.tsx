
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
                {isLoading && hasMore && <LoaderCircle className="h-6 w-6 animate-spin text-primary" />}
                {!hasMore && results.length > 0 && <p className="text-muted-foreground">더 이상 결과가 없습니다.</p>}
          </div>
        </>
    );
};

export default PhotoResults;
