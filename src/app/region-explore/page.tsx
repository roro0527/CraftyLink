
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
  const [activeTab, setActiveTab] = React.useState<SearchCategory>('photo');
  const [isSearching, setIsSearching] = React.useState(false);
  

  const handleSearch = () => {
    if (searchQuery.trim() === '') return;
    setSubmittedQuery(searchQuery);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
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
                disabled={isSearching}
            />
            <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()} className="h-12 px-6">
                {isSearching ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                검색
            </Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SearchCategory)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="photo">사진</TabsTrigger>
            <TabsTrigger value="news">뉴스</TabsTrigger>
            <TabsTrigger value="dictionary">사전</TabsTrigger>
            <TabsTrigger value="video">동영상</TabsTrigger>
        </TabsList>

        <div className="mt-6">
            {!submittedQuery ? (
                <div className="text-center py-20 text-muted-foreground">
                    <p>궁금한 내용을 검색해보세요.</p>
                </div>
            ) : (
                <>
                    <TabsContent value="photo">
                        <PhotoResults query={submittedQuery} setIsParentLoading={setIsSearching} />
                    </TabsContent>
                    <TabsContent value="news">
                        <NewsResults query={submittedQuery} setIsParentLoading={setIsSearching} />
                    </TabsContent>
                    <TabsContent value="dictionary">
                        <DictionaryResult query={submittedQuery} setIsParentLoading={setIsSearching} />
                    </TabsContent>
                    <TabsContent value="video">
                        <VideoResults query={submittedQuery} setIsParentLoading={setIsSearching} />
                    </TabsContent>
                </>
            )}
        </div>
      </Tabs>
    </div>
  );
}
