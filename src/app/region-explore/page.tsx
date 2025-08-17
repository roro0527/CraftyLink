
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export default function RegionExplorePage() {
  const [region, setRegion] = React.useState('KR');
  const [timeIndex, setTimeIndex] = React.useState(0);

  const keywordRegionalData = {
    times: ["8월 10일", "8월 11일", "8월 12일"],
    regions: {
      "KR": {
        name: "대한민국",
        topVideos: ["게임 플레이 영상 A", "게임 뉴스 B", "게임 공략 C"]
      },
      "US": {
        name: "미국",
        topVideos: ["Game Review A", "Game Trailer B"]
      },
      "JP": {
        name: "일본",
        topVideos: ["ゲーム実況A", "新作レビューB"]
      }
    }
  };


  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">지역 탐색</h1>

      <Card className="mb-6">
        <CardContent className="p-4">
           <div 
            className="h-[400px] bg-muted rounded-xl flex items-center justify-center"
            data-ai-hint="world map"
          >
            <p className="text-muted-foreground">[지도 표시 영역]</p>
          </div>
        </CardContent>
      </Card>
      

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">지역별 인기 동영상</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="mb-4">
                <SelectValue placeholder="지역 선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(keywordRegionalData.regions).map(([key, value]) => (
                   <SelectItem key={key} value={key}>{value.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ul className="list-disc pl-5 text-sm space-y-2">
              {(keywordRegionalData.regions[region as keyof typeof keywordRegionalData.regions]?.topVideos || []).map((video, index) => (
                <li key={index}>{video}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">시간대별 확산 패턴</CardTitle>
          </CardHeader>
          <CardContent>
            <Slider
              value={[timeIndex]}
              onValueChange={(value) => setTimeIndex(value[0])}
              min={0}
              max={2}
              step={1}
              className="w-full mb-2"
            />
            <p className="text-sm text-muted-foreground mb-4 text-center">
              시간: {keywordRegionalData.times[timeIndex]}
            </p>
             <div className="h-40 bg-muted rounded-md flex items-center justify-center mt-4">
              <p className="text-muted-foreground">차트 데이터가 없습니다.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
