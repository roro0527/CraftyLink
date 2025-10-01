
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';

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
    <div className="flex flex-wrap justify-center items-center gap-2 my-4">
      {keywords.map((keyword, index) => (
        <Badge
          key={keyword}
          variant={activeIndex === index ? 'default' : 'secondary'}
          onClick={() => onKeywordClick(index)}
          className="cursor-pointer transition-colors text-sm"
        >
          #{keyword}
        </Badge>
      ))}
    </div>
  );
};

export default RecommendedKeywords;
