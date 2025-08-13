'use client';

import { Wand2, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '../ui/label';

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
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          1. URL 입력
        </CardTitle>
        <CardDescription>
          아래에 하나 이상의 URL을 한 줄에 하나씩 붙여넣으세요. 앱이 쿼리 매개변수를 분석합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full gap-1.5">
          <Label htmlFor="urls">URL 목록</Label>
          <Textarea
            id="urls"
            placeholder="예: https://example.com?lang=en&theme=dark\nhttps://example.com?lang=fr&theme=light"
            value={urlsInput}
            onChange={(e) => onUrlsInputChange(e.target.value)}
            rows={6}
            className="text-base"
            disabled={isAnalyzing}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onAnalyze} disabled={isAnalyzing || !urlsInput.trim()}>
          {isAnalyzing ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Wand2 />
          )}
          <span className="ml-2">URL 분석</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UrlInputSection;
