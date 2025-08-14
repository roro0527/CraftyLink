'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import UrlInputSection from '@/components/app/url-input-section';
import { Toaster } from "@/components/ui/toaster"
import { FloatingCard } from '@/components/app/floating-card';
import { useFloatingCard } from '@/hooks/use-floating-card';

export default function Home() {
  const { toast } = useToast();
  const [searchInput, setSearchInput] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const { onClose } = useFloatingCard();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Close floating card after 5 seconds on initial load
    return () => clearTimeout(timer);
  }, [onClose]);


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
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow container mx-auto px-4 py-8">
           <div className="w-full max-w-2xl mx-auto mb-12">
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
        <Toaster />
        <FloatingCard />
      </div>
    </>
  );
}
