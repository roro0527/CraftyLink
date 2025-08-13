'use client';

import { Search, LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-4">
            <h2 className="text-xl font-semibold">1. 분석할 URL 입력</h2>
            <Textarea
              id="urls"
              placeholder="분석할 URL 목록을 한 줄에 하나씩 입력하세요. (예: https://example.com?a=1&b=2)"
              value={urlsInput}
              onChange={(e) => onUrlsInputChange(e.target.value)}
              className="min-h-[120px] text-sm"
              disabled={isAnalyzing}
            />
            <Button onClick={onAnalyze} disabled={isAnalyzing || !urlsInput.trim()} className="w-full">
              {isAnalyzing ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Search />
              )}
              <span className="ml-2">URL 분석</span>
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UrlInputSection;
