
'use client';

import { Search, LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import * as React from 'react';
import { useState, useEffect } from 'react';

interface UrlInputSectionProps {
  urlsInput: string;
  onUrlsInputChange: (value: string) => void;
  onSearch: () => void;
  isSearching: boolean;
}

const recommendedKeywords = ['게임', '먹방', '여행', '뷰티', 'IT'];

const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  urlsInput,
  onUrlsInputChange,
  onSearch,
  isSearching,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % recommendedKeywords.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    onUrlsInputChange(recommendedKeywords[activeIndex]);
  }, [activeIndex, onUrlsInputChange]);


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
          <div className="absolute top-1/2 -translate-y-1/2 left-4 pointer-events-none">
            {isSearching ? (
              <LoaderCircle className="h-5 w-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <Textarea
            id="urls"
            placeholder="검색할 키워드를 입력"
            value={urlsInput}
            onChange={(e) => onUrlsInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-12 pr-4 h-[66px] text-2xl rounded-3xl border-input focus-visible:ring-primary focus-visible:ring-2 shadow-sm hover:shadow-md transition-shadow resize-none"
            disabled={isSearching}
            style={{ paddingTop: '14px' }}
          />
        </div>
         <div className="flex justify-center items-center gap-3 mt-4 h-4">
            {recommendedKeywords.map((keyword, index) => (
              <div
                key={keyword}
                onClick={() => setActiveIndex(index)}
                className={`relative h-2.5 w-2.5 rounded-full cursor-pointer transition-all duration-300 overflow-hidden ${
                  activeIndex === index
                    ? 'bg-gray-400 transform scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={`'${keyword}' 검색`}
              >
                {activeIndex === index && (
                  <div 
                    key={activeIndex} 
                    className="h-full bg-primary origin-left animate-indicator-progress"
                  ></div>
                )}
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};

export default UrlInputSection;
