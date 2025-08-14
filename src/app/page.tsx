'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import type { ParsedUrl, SuperParam } from '@/lib/types';
import { parseUrlsFromString, generateUrlPermutations } from '@/lib/url-utils';
import { suggestSuperParametersAction } from '@/app/actions';
import AppHeader from '@/components/app/app-header';
import UrlInputSection from '@/components/app/url-input-section';
import ParsedUrlsSection from '@/components/app/parsed-urls-section';
import SuperParametersSection from '@/components/app/super-parameters-section';
import GeneratedUrlsSection from '@/components/app/generated-urls-section';
import { Toaster } from "@/components/ui/toaster"
import { Sidebar } from '@/components/ui/sidebar';
import { FloatingCard } from '@/components/app/floating-card';
import { useFloatingCard } from '@/hooks/use-floating-card';

export default function Home() {
  const { toast } = useToast();
  const [urlsInput, setUrlsInput] = useState<string>('');
  const [parsedUrls, setParsedUrls] = useState<ParsedUrl[]>([]);
  const [superParams, setSuperParams] = useState<SuperParam[]>([]);
  const [generatedUrls, setGeneratedUrls] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const { onClose } = useFloatingCard();

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Close floating card after 5 seconds on initial load
    return () => clearTimeout(timer);
  }, [onClose]);


  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setParsedUrls([]);
    setSuperParams([]);
    setGeneratedUrls([]);
    
    setTimeout(() => {
      const parsed = parseUrlsFromString(urlsInput);
      if (parsed.length === 0) {
        toast({
          variant: 'destructive',
          title: '유효한 URL을 찾을 수 없습니다',
          description: '분석을 위해 하나 이상의 유효한 URL을 입력해주세요.',
        });
        setIsAnalyzing(false);
        return;
      }
      setParsedUrls(parsed);
      setUrlsInput(''); // Clear input after analysis
      setIsAnalyzing(false);
    }, 500);
  };
  
  const handleUpdateParsedUrl = (updatedUrl: ParsedUrl) => {
    setParsedUrls(current => current.map(url => url.id === updatedUrl.id ? updatedUrl : url));
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    try {
      const urlsToSuggest = parsedUrls.map(p => p.originalUrl);
      const suggestions = await suggestSuperParametersAction(urlsToSuggest);
      setSuperParams(suggestions.map(s => ({...s, id: nanoid()})));
       toast({
        title: 'AI 추천 준비 완료!',
        description: '아래에서 슈퍼 매개변수를 검토하고 편집하세요.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'AI 추천 실패',
        description: (error as Error).message,
      });
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleUpdateSuperParam = (updatedParam: SuperParam) => {
    setSuperParams(current => current.map(p => p.id === updatedParam.id ? updatedParam : p));
  };
  
  const handleGenerate = () => {
    if (parsedUrls.length === 0) {
      toast({
        variant: 'destructive',
        title: '기준 URL 없음',
        description: '먼저 하나 이상의 URL을 분석해주세요.',
      });
      return;
    }
    const baseUrl = parsedUrls[0].baseUrl;
    const permutations = generateUrlPermutations(baseUrl, superParams);
    setGeneratedUrls(permutations);
  };

  const showResults = parsedUrls.length > 0 || generatedUrls.length > 0;

  return (
    <>
      <Sidebar />
      <div className="flex flex-col min-h-screen">
        <AppHeader />
        <main className="flex-grow container mx-auto px-4 py-8">
           <div className="w-full max-w-2xl mx-auto mb-12">
             <UrlInputSection
              urlsInput={urlsInput}
              onUrlsInputChange={setUrlsInput}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          </div>
          <div className="flex flex-col gap-12 max-w-4xl mx-auto">
            {parsedUrls.length > 0 && (
              <>
                <ParsedUrlsSection
                  parsedUrls={parsedUrls}
                  onUpdateParsedUrl={handleUpdateParsedUrl}
                />
                <SuperParametersSection
                  superParams={superParams}
                  onUpdateSuperParam={handleUpdateSuperParam}
                  onSuggest={handleSuggest}
                  onGenerate={handleGenerate}
                  isSuggesting={isSuggesting}
                />
              </>
            )}

            {generatedUrls.length > 0 && (
              <GeneratedUrlsSection generatedUrls={generatedUrls} />
            )}
          </div>
        </main>
        <Toaster />
        <FloatingCard />
      </div>
    </>
  );
}
