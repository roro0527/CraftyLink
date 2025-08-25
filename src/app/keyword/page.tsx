
'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { LoaderCircle, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function KeywordPage() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get('q') || '특정 키워드';

  const [keywordSearch, setKeywordSearch] = React.useState(initialKeyword);
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    const queryKeyword = searchParams.get('q');
    if (queryKeyword) {
      setKeywordSearch(queryKeyword);
    }
  }, [searchParams]);
  
  const keywordData = {
    name: keywordSearch,
    description: '이 키워드에 대한 간단한 설명입니다.',
    kpi: {
      searchVolume: '1.2M',
      frequency: '5,820',
    },
  };

  const handleSearch = () => {
    if (!keywordSearch.trim()) return;
    setIsSearching(true);
    console.log(`Searching for: ${keywordSearch}`);
    // TODO: Implement search logic
    setTimeout(() => {
      setIsSearching(false);
    }, 1000);
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div id="keyword-page" className="p-6">
      {/* 상단: 키워드 개요 + KPI */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div className="w-full md:w-auto md:max-w-md">
           <div className="relative">
            <Input
              type="text"
              placeholder="키워드 검색..."
              value={keywordSearch}
              onChange={(e) => setKeywordSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-4 pr-14 h-14 text-3xl font-bold rounded-lg border-2 border-transparent hover:border-border focus:border-primary transition-colors bg-card"
              disabled={isSearching}
            />
             <Button
                variant="ghost"
                size="icon"
                onClick={handleSearch}
                disabled={isSearching || !keywordSearch.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10"
              >
                {isSearching ? (
                  <LoaderCircle className="h-6 w-6 text-gray-400 animate-spin" />
                ) : (
                  <Search className="h-6 w-6 text-gray-500" />
                )}
                 <span className="sr-only">검색</span>
              </Button>
          </div>
          <p className="text-muted-foreground mt-2 ml-2">{keywordData.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 md:mt-0 w-full md:w-auto">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">검색량</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{keywordData.kpi.searchVolume}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">등장 빈도</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{keywordData.kpi.frequency}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 시간 범위 선택 + 액션 버튼 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <Select defaultValue="1w">
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="시간 범위 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5d">최근 5일</SelectItem>
            <SelectItem value="1w">최근 1주</SelectItem>
            <SelectItem value="1m">최근 1개월</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline">저장</Button>
          <Button variant="outline">비교</Button>
          <Button variant="outline">경보</Button>
          <Button>CSV 내보내기</Button>
        </div>
      </div>

      {/* 메인 영역: 선그래프 + 테이블 + 사이드 */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>키워드 출현 빈도</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">차트 데이터가 없습니다.</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>관련 영상 목록</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>제목</TableHead>
                    <TableHead>업로드일</TableHead>
                    <TableHead>조회수</TableHead>
                    <TableHead>구독자 증가</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
           <Card>
            <CardHeader>
              <CardTitle>연관 태그</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-60 bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">[워드클라우드]</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
