
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, Search, Video } from 'lucide-react';
import { getYoutubeVideosAction } from '../actions';
import type { YoutubeVideo } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

const RegionMap = dynamic(() => import('@/components/app/region-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

export default function RegionExplorePage() {
  const initialCenter: [number, number] = [36.5, 127.5]; // Center of South Korea
  const initialZoom = 7;

  const [keyword, setKeyword] = React.useState('');
  const [videos, setVideos] = React.useState<YoutubeVideo[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setIsSearching(true);
    setVideos([]);
    try {
      const results = await getYoutubeVideosAction({ keyword });
      setVideos(results);
    } catch (error) {
      console.error('Failed to fetch YouTube videos:', error);
      // You can add a toast notification here to inform the user.
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full relative">
      <RegionMap center={initialCenter} zoom={initialZoom} />
      <div className="absolute top-4 left-4 w-full max-w-sm h-[calc(100%-2rem)]">
        <Card className="w-full h-full bg-card/80 backdrop-blur-sm flex flex-col">
          <CardHeader>
            <CardTitle>키워드 영상 탐색</CardTitle>
            <div className="flex w-full items-center space-x-2 pt-2">
              <Input
                type="text"
                placeholder="키워드 입력..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSearching}
              />
              <Button onClick={handleSearch} disabled={isSearching || !keyword.trim()}>
                {isSearching ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {isSearching ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                       <Skeleton className="h-16 w-28 rounded-md" />
                       <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                       </div>
                    </div>
                  ))
                ) : videos.length > 0 ? (
                  videos.map((video, index) => (
                    <div key={index} className="p-2 rounded-lg hover:bg-accent">
                      <p className="font-semibold text-sm line-clamp-2">{video.title}</p>
                      <p className="text-xs text-muted-foreground">{video.channelTitle}</p>
                       <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                         <span>조회수 {parseInt(video.viewCount, 10).toLocaleString()}회</span>
                         <span>{format(parseISO(video.publishedAt), 'yyyy.MM.dd')}</span>
                       </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-16">
                    <Video className="h-12 w-12 mb-4" />
                    <p className="font-semibold">검색 결과가 없습니다.</p>
                    <p className="text-sm">키워드를 검색하여 관련 영상을 찾아보세요.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
