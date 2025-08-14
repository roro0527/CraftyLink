'use client';

import { Search, LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

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
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-2xl font-bold tracking-tight">
        분석할 URL을 입력하세요
      </h2>
      <div className="w-full">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Textarea
            id="urls"
            placeholder="분석할 URL 목록을 한 줄에 하나씩 입력하세요. (예: https://example.com?a=1&b=2)"
            value={urlsInput}
            onChange={(e) => onUrlsInputChange(e.target.value)}
            className="pl-10 pr-4 py-3 min-h-[140px] text-base rounded-3xl border-gray-200 focus-visible:ring-primary focus-visible:ring-2 shadow-sm hover:shadow-md transition-shadow"
            disabled={isAnalyzing}
          />
        </div>
      </div>
      <Button 
        onClick={onAnalyze} 
        disabled={isAnalyzing || !urlsInput.trim()} 
        size="lg"
        className="rounded-full"
      >
        {isAnalyzing ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <Search />
        )}
        <span className="ml-2">URL 분석</span>
      </Button>
    </div>
  );
};

export default UrlInputSection;
