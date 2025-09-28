
'use client';

import { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import type { SearchResult } from '@/lib/types';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FUNCTION_REGION = 'asia-northeast3';

export const useGetGoogleImages = (query: string) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startIndex, setStartIndex] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchImages = useCallback(async (currentQuery: string, start: number) => {
    if (!currentQuery || !PROJECT_ID) {
        if (!PROJECT_ID) console.error("Firebase Project ID is not configured.");
        return;
    }
    
    setIsLoading(true);
    setError(null);

    const functionUrl = `https://${FUNCTION_REGION}-${PROJECT_ID}.cloudfunctions.net/api/getGoogleImages`;

    try {
      const response = await axios.get(functionUrl, {
        params: {
            query: currentQuery,
            start: start,
        }
      });
      
      const { photos, nextPage } = response.data;
      
      if (start === 1) {
          setResults(photos || []);
      } else {
          setResults(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newPhotos = (photos || []).filter((p: SearchResult) => !existingIds.has(p.id));
              return [...prev, ...newPhotos];
          });
      }

      if (nextPage) {
          setStartIndex(nextPage);
          setHasMore(true);
      } else {
          setHasMore(false);
      }

    } catch (err: any) {
      console.error("Failed to fetch images via function URL", err);
      let errorMessage = "이미지를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.";
      if (err instanceof AxiosError) {
          errorMessage = `[${err.code}] ${err.message}`;
          if (err.response) {
            console.error("Error response:", err.response.data);
            errorMessage += `: ${err.response.data?.error || 'Server error'}`
          }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect for initial fetch when query changes
  useEffect(() => {
    if (query) {
      setResults([]);
      setStartIndex(1);
      setHasMore(true);
      fetchImages(query, 1);
    } else {
      setResults([]);
    }
  }, [query, fetchImages]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchImages(query, startIndex);
    }
  };

  return { results, isLoading, error, hasMore, loadMore };
};
