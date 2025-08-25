
'use client';

import { Search, LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import * as React from 'react';
import { Button } from '../ui/button';

interface UrlInputSectionProps {
  urlsInput: string;
  onUrlsInputChange: (value: string) => void;
  onSearch: () => void;
  isSearching: boolean;
}

const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  urlsInput,
  onUrlsInputChange,
  onSearch,
  isSearching,
}) => {

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isSearching && urlsInput.trim()) {
        onSearch();
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="w-full max-w-[560px]">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearch}
            disabled={isSearching || !urlsInput.trim()}
            className="absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12"
          >
            {isSearching ? (
              <LoaderCircle className="h-5 w-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-black-400" />
            )}
            <span className="sr-only">검색</span>
          </Button>
          <Textarea
            id="urls"
            placeholder="검색할 키워드를 입력"
            value={urlsInput}
            onChange={(e) => onUrlsInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-16 pr-4 h-[66px] text-2xl rounded-3xl border-input focus-visible:ring-primary focus-visible:ring-2 shadow-sm hover:shadow-md transition-shadow resize-none bg-background"
            disabled={isSearching}
            style={{ paddingTop: '14px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default UrlInputSection;
