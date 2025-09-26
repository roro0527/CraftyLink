
'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { getYoutubeVideosAction } from '@/app/actions';
import type { YoutubeVideosData } from '@/ai/flows/youtube-videos-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

interface VideoResultsProps {
    query: string;
    setIsLoading: (isLoading: boolean) => void;
}

const VideoResults: React.FC<VideoResultsProps> = ({ query, setIsLoading }) => {
    const [results, setResults] = React.useState<YoutubeVideosData>([]);
    const [isFetching, setIsFetching] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const fetchVideos = async () => {
            if (!query) {
                setResults([]);
                return;
            };
            setIsFetching(true);
            setIsLoading(true);
            setError(null);
            try {
                const videos = await getYoutubeVideosAction({ keyword: query });
                setResults(videos);
            } catch (err) {
                console.error("Failed to fetch videos", err);
                setError("동영상 정보를 가져오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
            } finally {
                setIsFetching(false);
                setIsLoading(false);
            }
        };

        fetchVideos();
    }, [query, setIsLoading]);

    if (!query) {
        return null;
    }

    if (isFetching) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
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
    
    if (error) {
        return (
             <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>오류</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    if (results.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>관련 동영상을 찾을 수 없습니다.</p>
            </div>
        );
    }

    return (
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
    );
};

export default VideoResults;
