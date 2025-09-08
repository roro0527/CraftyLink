
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the map component to avoid SSR issues with Leaflet
const RegionMap = dynamic(() => import('@/components/app/region-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full" />,
});

export default function RegionExplorePage() {
  const initialCenter: [number, number] = [37.566826, 126.9786567]; // 서울 시청
  const initialZoom = 7;

  return (
    <div className="h-[calc(100vh-64px)] w-full p-0">
      <RegionMap center={initialCenter} zoom={initialZoom} />
    </div>
  );
}
