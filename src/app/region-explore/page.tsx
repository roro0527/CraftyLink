
'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const RegionMap = dynamic(() => import('@/components/app/region-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-[calc(100vh-64px)]" />,
});

export default function RegionExplorePage() {
  const initialCenter: [number, number] = [37.5665, 126.9780]; // Seoul City Hall
  const initialZoom = 7;

  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <RegionMap 
        center={initialCenter} 
        zoom={initialZoom} 
      />
    </div>
  );
}
