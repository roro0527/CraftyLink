
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoaderCircle, Search, ImageIcon, BookOpen, Clapperboard, Newspaper } from 'lucide-react';
import type { SearchCategory } from '@/lib/types';
import PhotoResults from '@/components/app/photo-results';
import NewsResults from '@/components/app/news-results';
import VideoResults from '@/components/app/video-results';
import DictionaryResult from '@/components/app/dictionary-result';


export default function RegionExplorePage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [submittedQuery, setSubmittedQuery] = React.useState('');
  const [category, setCategory] = React.useState<SearchCategory>('photo');
  const [isLoading, setIsLoading] = React.useState(false);
  const [initialSearchDone, setInitialSearchDone] = React.useState(false);


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
  
  const onTabChange = (value: string) => {
    const newCategory = value as SearchCategory;
    setCategory(newCategory);
  };
  

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
                disabled={isLoading}
            />
            <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()} className="h-12 px-6">
                {isLoading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                검색
            </Button>
        </div>
      </header>

      <Tabs value={category} onValueChange={onTabChange} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:mx-auto">
          <TabsTrigger value="photo" className="gap-1"><ImageIcon className="h-4 w-4" />사진</TabsTrigger>
          <TabsTrigger value="news" className="gap-1"><Newspaper className="h-4 w-4" />뉴스</TabsTrigger>
          <TabsTrigger value="dictionary" className="gap-1"><BookOpen className="h-4 w-4" />사전</TabsTrigger>
          <TabsTrigger value="video" className="gap-1"><Clapperboard className="h-4 w-4" />동영상</TabsTrigger>
        </TabsList>

        <div className="mt-6">
            {!initialSearchDone ? (
                <div className="text-center py-20 text-muted-foreground">
                    <p>궁금한 내용을 검색해보세요.</p>
                </div>
            ) : (
                <>
                    <TabsContent value="photo" forceMount={true} hidden={category !== 'photo'}>
                        <PhotoResults query={submittedQuery} />
                    </TabsContent>
                    <TabsContent value="news" forceMount={true} hidden={category !== 'news'}>
                        <NewsResults query={submittedQuery} setIsLoading={setIsLoading} />
                    </TabsContent>
                    <TabsContent value="dictionary" forceMount={true} hidden={category !== 'dictionary'}>
                        <DictionaryResult query={submittedQuery} setIsLoading={setIsLoading} />
                    </TabsContent>
                    <TabsContent value="video" forceMount={true} hidden={category !== 'video'}>
                        <VideoResults query={submittedQuery} setIsLoading={setIsLoading} />
                    </TabsContent>
                </>
            )}
        </div>
      </Tabs>
    </div>
  );
}
