
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoaderCircle, Search, Image as ImageIcon, BookText, Clapperboard, Newspaper } from 'lucide-react';
import { getNaverNewsAction, getYoutubeVideosAction } from '../actions';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';
import type { SearchResult, SearchCategory } from '@/lib/types';


const SearchResultItem: React.FC<{ item: SearchResult }> = ({ item }) => {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-lg">
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        {item.imageUrl && (
          <div className="aspect-video overflow-hidden bg-muted">
            <Image
              src={item.imageUrl}
              alt={item.title}
              width={400}
              height={225}
              className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
        <CardContent className="p-4">
          <h3 className="font-semibold text-base line-clamp-2">{item.title}</h3>
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{item.description}</p>
          )}
          {item.source && (
            <p className="text-xs text-muted-foreground mt-2">{item.source}</p>
          )}
        </CardContent>
      </a>
    </Card>
  );
};


export default function RegionExplorePage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [submittedQuery, setSubmittedQuery] = React.useState('');
  const [category, setCategory] = React.useState<SearchCategory>('photo');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const { ref, inView } = useInView({ threshold: 0.5 });
  const [initialSearchDone, setInitialSearchDone] = React.useState(false);


  const fetchResults = React.useCallback(async (query: string, newCategory: SearchCategory, newPage: number) => {
    if (!query) return;
    setIsLoading(true);

    let newResults: SearchResult[] = [];
    const pageSize = 12;

    try {
      if (newCategory === 'photo') {
        newResults = Array.from({ length: pageSize }).map((_, i) => {
          const itemNum = (newPage - 1) * pageSize + i;
          return {
            id: `photo_${itemNum}`,
            title: `사진: ${query} ${itemNum + 1}`,
            url: `https://picsum.photos/seed/${query}${itemNum}/800/600`,
            imageUrl: `https://picsum.photos/seed/${query}${itemNum}/400/225`,
            description: `"${query}"와(과) 관련된 고품질 이미지입니다.`,
            source: 'Picsum Photos',
          };
        });
      } else if (newCategory === 'blog') {
        const news = await getNaverNewsAction({ keyword: query });
        newResults = news.map(item => ({
          id: item.url,
          title: item.title,
          url: item.url,
          description: item.summary,
          source: '네이버 뉴스',
        }));
        setHasMore(false); // Naver News API doesn't have pagination in this flow
      } else if (newCategory === 'video') {
         const videos = await getYoutubeVideosAction({ keyword: query });
         newResults = videos.map(v => ({
            id: v.id,
            title: v.title,
            url: `https://www.youtube.com/watch?v=${v.id}`,
            imageUrl: `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`,
            description: `${v.channelTitle} · 조회수 ${parseInt(v.viewCount, 10).toLocaleString()}회`,
            source: 'YouTube',
         }));
         setHasMore(false); // YouTube API doesn't have pagination in this flow
      } else if (newCategory === 'dictionary') {
        newResults = Array.from({ length: pageSize }).map((_, i) => {
           const itemNum = (newPage - 1) * pageSize + i;
          return {
            id: `dict_${itemNum}`,
            title: `${query} ${itemNum + 1}`,
            url: '#',
            description: `'${query}'에 대한 ${itemNum + 1}번째 사전적 정의 또는 관련 설명입니다. 여기에는 단어의 의미, 어원, 사용 예시 등이 포함될 수 있습니다.`,
            source: '가상 사전',
          };
        });
      }
      
      // If it's a new search (page 1), replace results. Otherwise, append.
      if (newPage === 1) {
        setResults(newResults);
      } else {
        setResults(prev => [...prev, ...newResults]);
      }
      
      // For APIs that don't support pagination, we assume there are no more pages.
      if (newCategory === 'blog' || newCategory === 'video') {
        setHasMore(false);
      } else {
        setHasMore(newResults.length === pageSize);
      }

    } catch (error) {
      console.error('Error fetching results:', error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      if(newPage === 1) setInitialSearchDone(true);
    }
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim() === '') return;
    setSubmittedQuery(searchQuery);
    setPage(1);
    setResults([]);
    setHasMore(true);
    setInitialSearchDone(false);
    fetchResults(searchQuery, category, 1);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const onTabChange = (value: string) => {
    const newCategory = value as SearchCategory;
    setCategory(newCategory);
    setPage(1);
    setResults([]);
    setHasMore(true);
    setInitialSearchDone(false);
    if(submittedQuery) {
        fetchResults(submittedQuery, newCategory, 1);
    }
  };

  React.useEffect(() => {
    // If inView is true, we're near the bottom. Fetch more if not loading and hasMore is true.
    if (inView && !isLoading && hasMore && initialSearchDone) {
      setPage(prevPage => {
        const nextPage = prevPage + 1;
        fetchResults(submittedQuery, category, nextPage);
        return nextPage;
      });
    }
  }, [inView, isLoading, hasMore, submittedQuery, category, fetchResults, initialSearchDone]);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="mb-8 flex flex-col items-center">
        <div className="w-full max-w-xl flex gap-2">
            <Input
                type="text"
                placeholder="검색어를 입력하세요..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="h-12 text-lg"
            />
            <Button onClick={handleSearch} disabled={isLoading} className="h-12 px-6">
                {isLoading && page === 1 ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                검색
            </Button>
        </div>
      </header>

      <Tabs value={category} onValueChange={onTabChange} className="w-full mb-6">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:mx-auto">
          <TabsTrigger value="photo" className="gap-1"><ImageIcon className="h-4 w-4" />사진</TabsTrigger>
          <TabsTrigger value="blog" className="gap-1"><Newspaper className="h-4 w-4" />블로그</TabsTrigger>
          <TabsTrigger value="dictionary" className="gap-1"><BookText className="h-4 w-4" />사전</TabsTrigger>
          <TabsTrigger value="video" className="gap-1"><Clapperboard className="h-4 w-4" />동영상</TabsTrigger>
        </TabsList>

        <TabsContent value={category} className="mt-6">
           { (results.length > 0 || isLoading) ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((item) => <SearchResultItem key={item.id} item={item} />)}
                {isLoading && Array.from({ length: 8 }).map((_, i) => (
                  <Card key={`skel-${i}`}>
                    <Skeleton className="aspect-video w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full mt-1" />
                    </CardContent>
                  </Card>
                ))}
              </div>
              <div ref={ref} className="h-10 w-full mt-4 flex justify-center items-center">
                {isLoading && page > 1 && <LoaderCircle className="h-6 w-6 animate-spin text-primary" />}
                {!hasMore && results.length > 0 && <p className="text-muted-foreground">더 이상 결과가 없습니다.</p>}
              </div>
            </>
           ) : initialSearchDone ? (
              <div className="text-center py-20 text-muted-foreground">
                  <p>검색 결과가 없습니다.</p>
                  <p className="text-sm">다른 키워드로 검색해보세요.</p>
              </div>
           ) : (
             <div className="text-center py-20 text-muted-foreground">
                <p>궁금한 내용을 검색해보세요.</p>
             </div>
           )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
