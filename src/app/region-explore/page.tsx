
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Search } from 'lucide-react';
import PhotoResults from '@/components/app/photo-results';


export default function RegionExplorePage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [submittedQuery, setSubmittedQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [initialSearchDone, setInitialSearchDone] = React.useState(false);


  const handleSearch = () => {
    if (searchQuery.trim() === '') return;
    setIsLoading(true); // Start loading
    setSubmittedQuery(searchQuery);
    setInitialSearchDone(true);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // Callback for PhotoResults to signal when it's done loading
  const handleLoadingComplete = React.useCallback(() => {
    setIsLoading(false);
  }, []);

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

      <div className="mt-6">
            {!initialSearchDone ? (
                <div className="text-center py-20 text-muted-foreground">
                    <p>궁금한 내용을 검색해보세요.</p>
                </div>
            ) : (
                <PhotoResults query={submittedQuery} onLoadingComplete={handleLoadingComplete} />
            )}
        </div>
    </div>
  );
}
