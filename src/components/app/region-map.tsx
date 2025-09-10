
'use client';

import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

interface RegionMapProps {
  center: [number, number];
  zoom: number;
}

const RegionMap: React.FC<RegionMapProps> = ({ center, zoom }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAOMAP_APP_KEY;
  
  function initializeMap() {
      if (!mapContainerRef.current) return;
      
      const mapOption = {
        center: new window.kakao.maps.LatLng(center[0], center[1]),
        level: zoom,
      };

      mapRef.current = new window.kakao.maps.Map(mapContainerRef.current, mapOption);
  };

  // Initialize map
  useEffect(() => {
    if (!KAKAO_MAP_API_KEY || KAKAO_MAP_API_KEY === "YOUR_KAKAO_JAVASCRIPT_KEY") {
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
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services,clusterer,drawing&autoload=false`;
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
