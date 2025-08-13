'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface UrlInputSectionProps {
  urlsInput: string;
  onUrlsInputChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  urlsInput,
  onUrlsInputChange,
  onAnalyze,
  isAnalyzing,
}) => {
  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        id="urls"
        placeholder="URL을 입력하거나 검색어를 입력하세요..."
        value={urlsInput}
        onChange={(e) => onUrlsInputChange(e.target.value)}
        className="h-14 text-base pl-12 pr-4 rounded-full shadow-lg border-[2px] border-gray-300"
        disabled={isAnalyzing}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !isAnalyzing && urlsInput.trim()) {
            onAnalyze();
          }
        }}
      />
    </div>
  );
};

export default UrlInputSection;
