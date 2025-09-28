
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhotoResults from '@/components/app/photo-results';
import NewsResults from '@/components/app/news-results';
import DictionaryResult from '@/components/app/dictionary-result';
import VideoResults from '@/components/app/video-results';
import type { SearchCategory } from '@/lib/types';


export default function RegionExplorePage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [submittedQuery, setSubmittedQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [initialSearchDone, setInitialSearchDone] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<SearchCategory>('photo');
  const [loadingStates, setLoadingStates] = React.useState<Record<SearchCategory, boolean>>({
    photo: false,
    news: false,
    dictionary: false,
    video: false,
  });

  const handleSearch = () => {
    if (searchQuery.trim() === '') return;
    setSubmittedQuery(searchQuery);
    setInitialSearchDone(true);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleLoadingStateChange = React.useCallback((category: SearchCategory, isLoading: boolean) => {
    setLoadingStates(prev => ({...prev, [category]: isLoading }));
  }, []);

  const isAnyTabLoading = Object.values(loadingStates).some(state => state);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex flex-col items-center">
        <div className="w-full max-w-xl flex gap-2">
            <Input
                type="text"
                placeholder="검색어를 입력하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 text-lg"
                disabled={isAnyTabLoading}
            />
            <Button onClick={handleSearch} disabled={isAnyTabLoading || !searchQuery.trim()} className="h-12 px-6">
                {isAnyTabLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                검색
            </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SearchCategory)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="photo">사진</TabsTrigger>
            <TabsTrigger value="news" disabled>뉴스</TabsTrigger>
            <TabsTrigger value="dictionary" disabled>사전</TabsTrigger>
            <TabsTrigger value="video" disabled>동영상</TabsTrigger>
        </TabsList>

        <div className="mt-6">
            {!initialSearchDone ? (
                <div className="text-center py-20 text-muted-foreground">
                    <p>궁금한 내용을 검색해보세요.</p>
                </div>
            ) : (
                <>
                    <TabsContent value="photo">
                        <PhotoResults 
                            query={submittedQuery} 
                            onLoadingComplete={() => {}} 
                        />
                    </TabsContent>
                    <TabsContent value="news">
                        <NewsResults query={submittedQuery} setIsLoading={(loading) => handleLoadingStateChange('news', loading)} />
                    </TabsContent>
                    <TabsContent value="dictionary">
                        <DictionaryResult query={submittedQuery} setIsLoading={(loading) => handleLoadingStateChange('dictionary', loading)} />
                    </TabsContent>
                    <TabsContent value="video">
                        <VideoResults query={submittedQuery} setIsLoading={(loading) => handleLoadingStateChange('video', loading)} />
                    </TabsContent>
                </>
            )}
        </div>
      </Tabs>
    </div>
  );
}
