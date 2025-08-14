'use client';

import { Search, LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

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
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isAnalyzing && urlsInput.trim()) {
        onAnalyze();
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <h2 className="text-3xl font-bold tracking-tight">
        분석할 URL을 입력하세요
      </h2>
      <p className="text-muted-foreground text-center">
        여러 개의 URL을 한 줄에 하나씩 붙여넣고 Enter 키를 누르세요.
      </p>
      <div className="w-full max-w-2xl mt-4">
        <div className="relative">
          <div className="absolute top-4 left-4 pointer-events-none">
             {isAnalyzing ? (
              <LoaderCircle className="h-5 w-5 text-gray-400 animate-spin" />
            ) : (
              <Search className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <Textarea
            id="urls"
            placeholder="분석할 URL 목록을 한 줄에 하나씩 입력하세요. (예: https://example.com?a=1&b=2)"
            value={urlsInput}
            onChange={(e) => onUrlsInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-12 pr-4 py-4 min-h-[160px] text-base rounded-3xl border-gray-300 focus-visible:ring-primary focus-visible:ring-2 shadow-sm hover:shadow-md transition-shadow resize-none"
            disabled={isAnalyzing}
          />
        </div>
      </div>
    </div>
  );
};

export default UrlInputSection;
