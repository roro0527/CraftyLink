
'use client';

import React, { useEffect, useRef } from 'react';
import regionsData from '@/lib/korea-regions.geo.json';

declare global {
  interface Window {
    kakao: any;
  }
}

interface RegionMapProps {
  onRegionSelect: (region: { code: string; name: string }) => void;
  selectedRegionCode?: string | null;
}

const RegionMap: React.FC<RegionMapProps> = ({ onRegionSelect, selectedRegionCode }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const polygonsRef = useRef<any[]>([]);
  const selectedPolygonRef = useRef<any>(null);
  const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAOMAP_APP_KEY;

  const displayArea = (coordinates: any[], name: string, code: string) => {
    if (!mapRef.current) return;
    const path = coordinates[0].map((coord: number[]) => new window.kakao.maps.LatLng(coord[1], coord[0]));
    
    const polygon = new window.kakao.maps.Polygon({
      map: mapRef.current,
      path: path,
      strokeWeight: 2,
      strokeColor: '#004c80',
      strokeOpacity: 0.8,
      fillColor: '#fff',
      fillOpacity: 0.7,
    });

    polygonsRef.current.push(polygon);

    window.kakao.maps.event.addListener(polygon, 'mouseover', () => {
      if (polygon !== selectedPolygonRef.current) {
        polygon.setOptions({ fillColor: '#09f' });
      }
    });

    window.kakao.maps.event.addListener(polygon, 'mouseout', () => {
      if (polygon !== selectedPolygonRef.current) {
        polygon.setOptions({ fillColor: '#fff' });
      }
    });

    window.kakao.maps.event.addListener(polygon, 'click', () => {
      if (selectedPolygonRef.current && selectedPolygonRef.current !== polygon) {
        selectedPolygonRef.current.setOptions({ fillColor: '#fff' });
      }
      polygon.setOptions({ fillColor: '#09f' });
      selectedPolygonRef.current = polygon;
      onRegionSelect({ name, code });
    });
  };

  const initializeMap = () => {
    if (!mapContainerRef.current) return;

    const mapOption = {
      center: new window.kakao.maps.LatLng(36.2, 127.6),
      level: 13,
    };

    mapRef.current = new window.kakao.maps.Map(mapContainerRef.current, mapOption);

    regionsData.features.forEach(feature => {
      const { geometry, properties } = feature;
      if (geometry.type === 'Polygon') {
        displayArea(geometry.coordinates, properties.nm, properties.code);
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach(coords => {
          displayArea(coords, properties.nm, properties.code);
        });
      }
    });
  };

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
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services,drawing&autoload=false`;
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
