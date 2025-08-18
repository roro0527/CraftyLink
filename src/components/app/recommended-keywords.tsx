
'use client';

import * as React from 'react';

interface RecommendedKeywordsProps {
  keywords: string[];
  activeIndex: number;
  onKeywordClick: (index: number) => void;
}

const RecommendedKeywords: React.FC<RecommendedKeywordsProps> = ({
  keywords,
  activeIndex,
  onKeywordClick,
}) => {
  return (
    <div className="flex justify-center items-center gap-3 h-4">
      {keywords.map((keyword, index) => (
        <div
          key={keyword}
          onClick={() => onKeywordClick(index)}
          className={`relative h-2.5 rounded-full cursor-pointer transition-all duration-300 overflow-hidden ${
            activeIndex === index
              ? 'w-8 bg-gray-400'
              : 'w-2.5 bg-gray-300 hover:bg-gray-400'
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
  );
};

export default RecommendedKeywords;
