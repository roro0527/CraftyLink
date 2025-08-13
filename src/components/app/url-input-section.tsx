'use client';

import { Wand2, LoaderCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  return (
    <>
      <p className="text-sm text-muted-foreground">
        아래에 하나 이상의 URL을 한 줄에 하나씩 붙여넣으세요. 앱이 쿼리 매개변수를 분석합니다.
      </p>
      <div className="relative w-full">
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
          <Textarea
            id="urls"
            placeholder="예: https://example.com?lang=en&theme=dark"
            value={urlsInput}
            onChange={(e) => onUrlsInputChange(e.target.value)}
            rows={4}
            className="text-base pl-12 pr-4 py-3 resize-none"
            disabled={isAnalyzing}
          />
      </div>
      <div>
        <Button onClick={onAnalyze} disabled={isAnalyzing || !urlsInput.trim()}>
          {isAnalyzing ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Wand2 />
          )}
          <span className="ml-2">URL 분석</span>
        </Button>
      </div>
    </>
  );
};

export default UrlInputSection;
