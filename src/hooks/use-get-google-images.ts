
'use client';

/**
 * @file 구글 이미지 검색을 위한 커스텀 훅입니다.
 * 검색어(query)를 받아 이미지 검색 결과를 관리하고, 무한 스크롤을 위한 상태와 함수를 제공합니다.
 */

import { useState, useEffect, useCallback } from 'react';
import type { SearchResult } from '@/lib/types';
import { getGoogleImagesAction } from '@/app/actions';

export const useGetGoogleImages = (query: string) => {
  // --- State 정의 ---
  const [results, setResults] = useState<SearchResult[]>([]); // 이미지 검색 결과 목록
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태
  const [error, setError] = useState<string | null>(null); // 에러 메시지
  const [startIndex, setStartIndex] = useState(1); // 다음 검색 시작 인덱스
  const [hasMore, setHasMore] = useState(true); // 추가 데이터 존재 여부
  
  /**
   * 이미지 검색 Cloud Function을 호출하여 데이터를 가져오는 함수.
   * useCallback으로 메모이제이션하여 불필요한 함수 재생성을 방지합니다.
   * @param currentQuery 현재 검색어
   * @param start 검색 시작 인덱스
   */
  const fetchImages = useCallback(async (currentQuery: string, start: number) => {
    if (!currentQuery) return;
    
    setIsLoading(true);
    setError(null);

    try {
        const response = await getGoogleImagesAction({ query: currentQuery, start: start });
      
      const { photos, nextPage } = response;
      
      if (start === 1) {
          // 첫 페이지 로드 시: 결과를 새로 설정
          setResults(photos || []);
      } else {
          // 추가 페이지 로드 시: 기존 결과에 새로운 결과를 추가 (중복 제거)
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
      console.error("Failed to fetch images via Action:", err);
      setError("이미지를 불러오는 데 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 검색어(query)가 변경되면 상태를 초기화하고 첫 페이지 데이터를 가져옵니다.
   */
  useEffect(() => {
    if (query) {
      setResults([]);
      setStartIndex(1);
      setHasMore(true);
      fetchImages(query, 1);
    } else {
      // 검색어가 없으면 모든 상태 초기화
      setResults([]);
      setStartIndex(1);
      setHasMore(true);
    }
  }, [query, fetchImages]);

  /**
   * 추가 데이터를 로드하는 함수. `react-intersection-observer`에 의해 호출됩니다.
   */
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchImages(query, startIndex);
    }
  }, [isLoading, hasMore, fetchImages, query, startIndex]);

  // 훅이 반환하는 상태와 함수들
  return { results, isLoading, error, hasMore, loadMore };
};
