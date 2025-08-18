
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import UrlInputSection from '@/components/app/url-input-section';
import RecommendedKeywords from '@/components/app/recommended-keywords';

const recommendedKeywords = ['게임', '먹방', '여행', '뷰티', 'IT'];

export default function Home() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % recommendedKeywords.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSearchInput(recommendedKeywords[activeIndex]);
  }, [activeIndex]);

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
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="w-screen mb-6 ml-[-50vw] left-1/2 relative">
          <div className="h-[30rem] bg-muted rounded-2xl flex flex-col items-center justify-center">
            <div className="w-full max-w-2xl">
               <UrlInputSection
                urlsInput={searchInput}
                onUrlsInputChange={setSearchInput}
                onSearch={handleSearch}
                isSearching={isSearching}
              />
            </div>
          </div>
        </div>
        
        <div className="w-full max-w-2xl mx-auto">
          <RecommendedKeywords 
            keywords={recommendedKeywords}
            activeIndex={activeIndex}
            onKeywordClick={setActiveIndex}
          />
        </div>

        <div className="flex flex-col gap-12 max-w-4xl mx-auto">
          {/* Results will be displayed here */}
        </div>
      </main>
    </>
  );
}
