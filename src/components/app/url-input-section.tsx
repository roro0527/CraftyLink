'use client';

import { Search, LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

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
      <div className="w-full max-w-2xl mt-4">
        <div className="relative">
          <div className="absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none flex items-center gap-2">
            {isSearching ? (
              <LoaderCircle className="h-5 w-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
            <div className="flex items-center gap-1.5 ml-2">
              <div className="h-2.5 w-2.5 bg-gray-300 rounded-full"></div>
              <div className="h-2.5 w-2.5 bg-gray-300 rounded-full"></div>
              <div className="h-2.5 w-2.5 bg-gray-300 rounded-full"></div>
              <div className="h-2.5 w-2.5 bg-gray-300 rounded-full"></div>
              <div className="h-2.5 w-2.5 bg-gray-300 rounded-full"></div>
            </div>
          </div>
          <Textarea
            id="urls"
            placeholder="검색할 키워드를 입력"
            value={urlsInput}
            onChange={(e) => onUrlsInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-32 pr-4 h-[66px] text-base rounded-3xl border-input focus-visible:ring-primary focus-visible:ring-2 shadow-sm hover:shadow-md transition-shadow resize-none"
            disabled={isSearching}
            style={{ paddingTop: '22px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default UrlInputSection;
