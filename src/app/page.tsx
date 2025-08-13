'use client';

import * as React from 'react';
import { useState } from 'react';
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

export default function Home() {
  const { toast } = useToast();
  const [urlsInput, setUrlsInput] = useState<string>('');
  const [parsedUrls, setParsedUrls] = useState<ParsedUrl[]>([]);
  const [superParams, setSuperParams] = useState<SuperParam[]>([]);
  const [generatedUrls, setGeneratedUrls] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

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
          title: 'No valid URLs found',
          description: 'Please enter at least one valid URL to analyze.',
        });
        setIsAnalyzing(false);
        return;
      }
      setParsedUrls(parsed);
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
        title: 'AI Suggestions Ready!',
        description: 'Review and edit the super-parameters below.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
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
        title: 'No Base URL',
        description: 'Please analyze at least one URL first.',
      });
      return;
    }
    const baseUrl = parsedUrls[0].baseUrl;
    const permutations = generateUrlPermutations(baseUrl, superParams);
    setGeneratedUrls(permutations);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-12">
          <UrlInputSection
            urlsInput={urlsInput}
            onUrlsInputChange={setUrlsInput}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />

          {parsedUrls.length > 0 && (
            <div className="flex flex-col gap-12">
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
            </div>
          )}

          {generatedUrls.length > 0 && (
            <GeneratedUrlsSection generatedUrls={generatedUrls} />
          )}
        </div>
      </main>
    </div>
  );
}
