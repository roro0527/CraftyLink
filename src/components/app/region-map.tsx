
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
      console.error("Kakao map API key is not configured in .env file (NEXT_PUBLIC_KAKAO_MAP_API_KEY).");
      return;
    }

    const scriptId = 'kakao-maps-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const loadMap = () => {
      window.kakao.maps.load(() => {
        if (!mapContainerRef.current || mapRef.current) {
          return;
        }

        const mapOption = {
          center: new window.kakao.maps.LatLng(center[0], center[1]),
          level: zoom,
        };

        const map = new window.kakao.maps.Map(mapContainerRef.current, mapOption);
        mapRef.current = map;

        // Add a marker to the center
        const marker = new window.kakao.maps.Marker({
          position: map.getCenter(),
        });
        marker.setMap(map);
      });
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&autoload=false&libraries=services`;
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        loadMap();
      };
      script.onerror = () => {
        console.error("Failed to load Kakao Maps script.");
      };
    } else if (window.kakao && window.kakao.maps) {
      // If script is already loaded, just load the map
      loadMap();
    }
  }, [center, zoom]);
  
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
