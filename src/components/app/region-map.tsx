
'use client';

import React, { useEffect, useRef } from 'react';
import regionsData from '@/lib/korea-regions.geo.json';

declare global {
  interface Window {
    kakao: any;
  }
}

interface RegionMapProps {
  center: [number, number];
  zoom: number;
  highlightedRegionCode?: string | null;
  bounds?: any;
}

const RegionMap: React.FC<RegionMapProps> = ({ center, zoom, highlightedRegionCode, bounds }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const polygonsRef = useRef<any[]>([]);
  const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAOMAP_APP_KEY;

  const createPolygon = (path: any[], highlighted: boolean) => {
    return new window.kakao.maps.Polygon({
      path: path,
      strokeWeight: 2,
      strokeColor: '#004c80',
      strokeOpacity: 0.8,
      fillColor: highlighted ? '#007BFF' : '#E0E0E0',
      fillOpacity: highlighted ? 0.5 : 0.3,
    });
  };

  const displayArea = (coordinates: any[], highlighted: boolean) => {
    const paths: any[][] = [];

    const processCoordinates = (coords: any[]) => {
      if (typeof coords[0][0] === 'number') {
        const path: any[] = [];
        coords.forEach((coord: any) => {
          path.push(new window.kakao.maps.LatLng(coord[1], coord[0]));
        });
        paths.push(path);
      } else {
        coords.forEach(processCoordinates);
      }
    };
    
    processCoordinates(coordinates);
    
    paths.forEach(path => {
        const polygon = createPolygon(path, highlighted);
        polygon.setMap(mapRef.current);
        polygonsRef.current.push(polygon);
    });
  };

  function initializeMap() {
    if (!mapContainerRef.current) return;

    const mapOption = {
      center: new window.kakao.maps.LatLng(center[0], center[1]),
      level: zoom,
    };

    mapRef.current = new window.kakao.maps.Map(mapContainerRef.current, mapOption);

    regionsData.features.forEach((feature) => {
      const isHighlighted = feature.properties.code === highlightedRegionCode;
      displayArea(feature.geometry.coordinates, isHighlighted);
    });
  }

  // Initialize map
  useEffect(() => {
    if (!KAKAO_MAP_API_KEY || KAKAO_MAP_API_KEY === "YOUR_KAKAOMAP_APP_KEY") {
      console.error("Kakao map API key is not configured. Please set NEXT_PUBLIC_KAKAOMAP_APP_KEY in your .env.local file.");
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '<div style="text-align: center; padding-top: 20px; color: red;">카카오맵 API 키가 설정되지 않았습니다.</div>';
      }
      return;
    }

    const scriptId = 'kakao-maps-sdk';
    if (document.getElementById(scriptId)) {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(initializeMap);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(initializeMap);
    };

    script.onerror = () => {
      console.error("Failed to load Kakao Maps script.");
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '<div style="text-align: center; padding-top: 20px; color: red;">카카오맵 스크립트를 불러오는데 실패했습니다.</div>';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update polygons when highlightedRegionCode changes
  useEffect(() => {
    if (!mapRef.current || polygonsRef.current.length === 0) return;

    // Clear existing polygons
    polygonsRef.current.forEach(p => p.setMap(null));
    polygonsRef.current = [];

    // Redraw polygons with new highlight
    regionsData.features.forEach((feature) => {
      const isHighlighted = feature.properties.code === highlightedRegionCode;
      displayArea(feature.geometry.coordinates, isHighlighted);
    });
  }, [highlightedRegionCode]);

  // Update map bounds
  useEffect(() => {
    if (mapRef.current && bounds) {
      mapRef.current.setBounds(bounds);
    }
  }, [bounds]);

  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.relayout();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default RegionMap;
