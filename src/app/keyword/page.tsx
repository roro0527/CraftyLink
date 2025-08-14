
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

export default function KeywordPage() {
  const keywordData = {
    name: '특정 키워드',
    description: '이 키워드에 대한 간단한 설명입니다.',
    kpi: {
      searchVolume: '1.2M',
      frequency: '5,820',
    },
  };

  return (
    <div id="keyword-page" className="p-6">
      {/* 상단: 키워드 개요 + KPI */}
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{keywordData.name}</h1>
          <p className="text-muted-foreground mt-1">{keywordData.description}</p>
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
              <CardTitle>지역별 관심도</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-60 bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">[미니맵]</p>
              </div>
            </CardContent>
          </Card>
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
