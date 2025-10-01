
'use client';

/**
 * @file '탐색' 페이지 컴포넌트입니다.
 * 사용자는 검색어를 입력하여 사진, 뉴스, 사전, 동영상 등 다양한 카테고리의 정보를 탐색할 수 있습니다.
 * 각 카테고리는 탭으로 구분됩니다.
 */

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoaderCircle, Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhotoResults from '@/components/app/photo-results';
import NewsResults from '@/components/app/news-results';
import DictionaryResult from '@/components/app/dictionary-result';
import VideoResults from '@/components/app/video-results';
import type { SearchCategory } from '@/lib/types';

export default function RegionExplorePage() {
  // --- State 정의 ---
  const [searchQuery, setSearchQuery] = React.useState(''); // 입력창의 현재 검색어
  const [submittedQuery, setSubmittedQuery] = React.useState(''); // 실제 검색을 실행한 검색어
  const [activeTab, setActiveTab] = React.useState<SearchCategory>('photo'); // 현재 활성화된 탭
  const [isSearching, setIsSearching] = React.useState(false); // 검색 버튼 자체의 로딩 상태

  /**
   * 검색 버튼 클릭 또는 Enter 입력 시 실행될 핸들러.
   * 입력된 검색어를 submittedQuery state에 저장하여 실제 검색을 트리거합니다.
   */
  const handleSearch = () => {
    if (searchQuery.trim() === '') return;
    // 검색어 제출 시, 이전과 다른 검색어일 경우 submittedQuery를 업데이트하여
    // 자식 컴포넌트들이 새로운 검색을 시작하도록 합니다.
    if (searchQuery !== submittedQuery) {
        setSubmittedQuery(searchQuery);
    }
  };
  
  /**
   * 입력창에서 Enter 키를 눌렀을 때 검색을 실행하는 핸들러입니다.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // --- JSX 렌더링 ---
  return (
    <div className="flex flex-col h-full">
      {/* 헤더: 검색창 */}
      <header className="sticky top-16 z-10 bg-background/80 backdrop-blur-sm border-b p-4">
        <div className="w-full max-w-xl mx-auto flex gap-2">
            <Input
                type="text"
                placeholder="검색어를 입력하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 text-lg"
                disabled={isSearching}
            />
            <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()} className="h-12 px-6">
                {isSearching ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                검색
            </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-8 py-6 flex-1">
        {/* 탭 메뉴 */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as SearchCategory)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="photo">사진</TabsTrigger>
              <TabsTrigger value="news">뉴스</TabsTrigger>
              <TabsTrigger value="dictionary">사전</TabsTrigger>
              <TabsTrigger value="video">동영상</TabsTrigger>
          </TabsList>

          {/* 탭 콘텐츠 */}
          <div className="mt-6">
              {!submittedQuery ? (
                  // 검색어가 제출되기 전의 초기 화면
                  <div className="text-center py-20 text-muted-foreground">
                      <p>궁금한 내용을 검색해보세요.</p>
                  </div>
              ) : (
                  // 검색어가 제출된 후 각 탭에 맞는 콘텐츠를 보여줌
                  <>
                      <TabsContent value="photo">
                          <PhotoResults query={submittedQuery} />
                      </TabsContent>
                      <TabsContent value="news">
                          <NewsResults query={submittedQuery} />
                      </TabsContent>
                      <TabsContent value="dictionary">
                          <DictionaryResult query={submittedQuery} />
                      </TabsContent>
                      <TabsContent value="video">
                          <VideoResults query={submittedQuery} />
                      </TabsContent>
                  </>
              )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
