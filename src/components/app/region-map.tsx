
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

  useEffect(() => {
    const KAKAO_MAP_API_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
    if (!KAKAO_MAP_API_KEY) {
      console.error("Kakao map API key is not configured. Please set NEXT_PUBLIC_KAKAO_MAP_API_KEY in your .env file.");
      return;
    }

    const scriptId = 'kakao-maps-sdk';
    if (document.getElementById(scriptId)) {
      // 스크립트가 이미 로드되었다면 지도를 바로 생성
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          initializeMap();
        });
      }
      return;
    }
    
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        initializeMap();
      });
    };

    script.onerror = () => {
      console.error("Failed to load Kakao Maps script.");
    };

    const initializeMap = () => {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }
      
      const mapOption = {
        center: new window.kakao.maps.LatLng(center[0], center[1]),
        level: zoom,
        mapTypeId: window.kakao.maps.MapTypeId.ROADMAP
      };

      const map = new window.kakao.maps.Map(mapContainerRef.current, mapOption);
      mapRef.current = map;

      // Add a simple marker
      const markerPosition = new window.kakao.maps.LatLng(center[0], center[1]);
      const marker = new window.kakao.maps.Marker({
        position: markerPosition
      });
      marker.setMap(map);
    };

  }, [center, zoom]);


  useEffect(() => {
    // Handle resize to prevent map layout breaking
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
