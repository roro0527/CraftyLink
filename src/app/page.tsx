'use client';

import * as React from 'react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import UrlInputSection from '@/components/app/url-input-section';

export default function Home() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    if (!searchInput.trim()) {
       toast({
        variant: 'destructive',
        title: '검색어를 입력하세요',
        description: 'URL을 검색하려면 키워드를 입력해주세요.',
      });
      return;
    }
    setIsSearching(true);
    console.log(`Searching for: ${searchInput}`);
    // TODO: Implement search logic
    setTimeout(() => {
      setIsSearching(false);
    }, 1000);
  };
  
  return (
    <>
      <div className="relative flex flex-col min-h-screen">
        <div className="absolute top-0 left-0 w-full h-full -z-10 bg-background overflow-hidden">
           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
          <div className="h-full w-full flex items-center justify-center">
            <div className="w-[80%] h-1/2 bg-muted/50 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">[선 그래프 영역]</p>
            </div>
          </div>
        </div>
        <main className="flex-grow container mx-auto px-4 py-8">
           <div className="w-full max-w-2xl mx-auto mb-12 pt-24">
             <UrlInputSection
              urlsInput={searchInput}
              onUrlsInputChange={setSearchInput}
              onSearch={handleSearch}
              isSearching={isSearching}
            />
          </div>
          <div className="flex flex-col gap-12 max-w-4xl mx-auto">
            {/* Results will be displayed here */}
          </div>
        </main>
      </div>
    </>
  );
}
