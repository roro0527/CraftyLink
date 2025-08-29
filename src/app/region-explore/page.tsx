
'use client';

import * as React from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

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
import dynamic from 'next/dynamic';
import type { LatLngExpression } from 'leaflet';

// Leaflet과 react-leaflet-draw는 window 객체를 사용하므로 dynamic import를 사용합니다.
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const FeatureGroup = dynamic(() => import('react-leaflet').then(mod => mod.FeatureGroup), { ssr: false });
const EditControl = dynamic(() => import('react-leaflet-draw').then(mod => mod.EditControl), { ssr: false });


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


function RegionExplorePage() {
  const [region, setRegion] = React.useState('KR');
  const [timeIndex, setTimeIndex] = React.useState(0);
  const [showMap, setShowMap] = React.useState(false);

  React.useEffect(() => {
    // 컴포넌트가 마운트된 후 짧은 지연을 주어 지도를 렌더링합니다.
    // 이는 React.StrictMode에서의 이중 호출로 인한 초기화 오류를 회피하기 위함입니다.
    const timer = setTimeout(() => {
      setShowMap(true);
    }, 1);

    return () => clearTimeout(timer);
  }, []);


  const _onCreated = (e: any) => {
    console.log('Polygon created:', e.layer.toGeoJSON());
    // 여기서 폴리곤 영역 내 데이터 필터링 로직을 추가할 수 있습니다.
  };

  const _onDeleted = (e: any) => {
    console.log('Polygon deleted:', e.layers);
  };

  const center: LatLngExpression = [37.5665, 126.9780];

  return (
    <div className="flex h-[calc(100vh-65px)]">
      <div className="flex-grow p-6">
        <h1 className="text-2xl font-bold mb-4">지역 탐색</h1>
        <Card className="h-[calc(100%-48px)]">
          <CardContent className="p-0 h-full">
             {showMap && (
                 <MapContainer center={center} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FeatureGroup>
                        <EditControl
                            position="topright"
                            onCreated={_onCreated}
                            onDeleted={_onDeleted}
                            draw={{
                                rectangle: false,
                                circlemarker: false,
                                circle: false,
                                marker: false,
                                polyline: false,
                                polygon: true,
                            }}
                        />
                    </FeatureGroup>
                </MapContainer>
            )}
          </CardContent>
        </Card>
      </div>
      
      <aside className="w-96 p-6 space-y-6 overflow-auto">
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
      </aside>
    </div>
  );
}

export default RegionExplorePage;
