
'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import type { SearchResult } from '@/lib/types';
import { Terminal, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useInView } from 'react-intersection-observer';
import { useGetGoogleImages } from '@/hooks/use-get-google-images';


const SearchResultItem: React.FC<{ item: SearchResult }> = ({ item }) => {
  const [isImageLoading, setIsImageLoading] = React.useState(true);
  const [isVisible, setIsVisible] = React.useState(true);

  const handleImageError = () => {
    setIsVisible(false);
  };
  
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`relative overflow-hidden rounded-lg break-inside-avoid group animate-in fade-in-25 duration-500 ${!isVisible ? 'hidden' : ''}`}>
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
    query: string;
    setIsParentLoading: (isLoading: boolean) => void;
}

const PhotoResults: React.FC<PhotoResultsProps> = ({ query, setIsParentLoading }) => {
    const { ref, inView } = useInView({ threshold: 0.5 });
    const { results, isLoading, error, hasMore, loadMore } = useGetGoogleImages(query);
    
    React.useEffect(() => {
      setIsParentLoading(isLoading);
    }, [isLoading, setIsParentLoading]);

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
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <Skeleton key={`skel-photo-${i}`} className="h-64 w-full" />
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
          <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-4 space-y-4">
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
