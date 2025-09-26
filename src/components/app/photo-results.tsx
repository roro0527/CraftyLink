
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import type { SearchResult } from '@/lib/types';
import { Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';


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
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
      const generatePlaceholderImages = () => {
        if (!query) {
          setResults([]);
          return;
        }
        setIsLoading(true);
        setError(null);
        
        try {
          const placeholderImages: SearchResult[] = Array.from({ length: 12 }).map((_, i) => ({
            id: `${query}-${i}`,
            title: `Placeholder for "${query}" #${i + 1}`,
            url: `https://picsum.photos/seed/${query}${i}/1200/800`,
            imageUrl: `https://picsum.photos/seed/${query}${i}/400/225`,
            description: `A placeholder image related to ${query}`,
            source: 'Picsum Photos',
          }));
          setResults(placeholderImages);
        } catch(e) {
          console.error("Failed to generate placeholder images", e);
          setError("이미지를 불러오는 데 실패했습니다.");
        } finally {
          setIsLoading(false);
        }
      };

      generatePlaceholderImages();
    }, [query]);


    if (!query && results.length === 0) {
        return null;
    }
    
    if (isLoading) {
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
        </>
    );
};

export default PhotoResults;
