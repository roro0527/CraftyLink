
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ZoomableKoreaMap from '@/components/app/zoomable-korea-map';

export default function RegionExplorePage() {

  return (
    <div className="flex h-[calc(100vh-65px)]">
      <div className="flex-grow p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-4">지역별 트렌드 탐색</h1>
        <Card className="flex-grow">
          <CardContent className="p-0 h-full">
            <ZoomableKoreaMap />
          </CardContent>
        </Card>
      </div>
      
      <aside className="w-96 p-6 space-y-6 overflow-auto bg-muted/30">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
                지역별 트렌드
            </CardTitle>
            <CardDescription>
                지도에서 지역을 클릭하여 인기 검색어와 관련 영상을 확인하세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
                <p className="text-muted-foreground">지도에서 지역을 선택해주세요.</p>
            </div>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
