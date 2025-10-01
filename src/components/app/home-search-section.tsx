
'use client';

import { Search, LoaderCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { Button } from '../ui/button';

interface HomeSearchSectionProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: () => void;
  isSearching: boolean;
}

const HomeSearchSection: React.FC<HomeSearchSectionProps> = ({
  searchInput,
  onSearchInputChange,
  onSearch,
  isSearching,
}) => {

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (!isSearching && searchInput.trim()) {
        onSearch();
      }
    }
  };

  return (
    <div className="text-center my-8">
      <h1 className="text-4xl font-bold tracking-tight mb-2">무엇이 궁금하세요?</h1>
      <p className="text-lg text-muted-foreground mb-6">키워드를 검색하여 트렌드, 뉴스를 확인해보세요.</p>
      <div className="relative mx-auto max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="search"
            placeholder="예: '게임', '여행', 'AI'"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-12 pr-4 h-12 text-base rounded-full shadow-sm hover:shadow-md transition-shadow bg-background/80 backdrop-blur-sm"
            disabled={isSearching}
          />
           {isSearching && (
              <LoaderCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
           )}
        </div>
    </div>
  );
};

export default HomeSearchSection;
