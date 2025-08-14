'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

export default function ComparePage() {
  const [keywords, setKeywords] = React.useState<string[]>([]);
  const [inputValue, setInputValue] = React.useState('');

  const handleAddKeyword = () => {
    if (inputValue && !keywords.includes(inputValue)) {
      setKeywords([...keywords, inputValue]);
      setInputValue('');
    }
  };

  const handleClearKeywords = () => {
    setKeywords([]);
  };

  return (
    <div className="p-6">
      <header className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold">키워드 비교</h1>
        <div className="flex gap-2">
          <Input
            type="text"
            id="keyword-input"
            placeholder="키워드 입력"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
            className="border p-2 rounded"
          />
          <Button onClick={handleAddKeyword} className="px-4 py-2 rounded">
            <Plus className="mr-2 h-4 w-4" /> 추가
          </Button>
          <Button onClick={handleClearKeywords} variant="outline" className="px-4 py-2 rounded">
            <Trash2 className="mr-2 h-4 w-4" /> 초기화
          </Button>
        </div>
      </header>

      <div className="mb-4">
        {keywords.map((keyword, index) => (
          <span key={index} className="inline-block bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">
            {keyword}
          </span>
        ))}
      </div>

      <section id="charts" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>라인 차트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">차트 데이터가 없습니다.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>막대 차트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-60 bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">차트 데이터가 없습니다.</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="summary-table" className="overflow-x-auto">
         <Card>
          <CardHeader>
            <CardTitle>요약</CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="min-w-full text-left">
              <TableHeader>
                <TableRow>
                  <TableHead>키워드</TableHead>
                  <TableHead>검색량</TableHead>
                  <TableHead>급증률</TableHead>
                  <TableHead>지역 확산</TableHead>
                  <TableHead>우세 여부</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords.length > 0 ? (
                  keywords.map((keyword) => (
                    <TableRow key={keyword}>
                      <TableCell>{keyword}</TableCell>
                      <TableCell>데이터 없음</TableCell>
                      <TableCell>데이터 없음</TableCell>
                      <TableCell>데이터 없음</TableCell>
                      <TableCell>데이터 없음</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      비교할 키워드를 추가해주세요.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
