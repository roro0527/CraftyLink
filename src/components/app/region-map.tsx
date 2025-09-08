
'use client';

import React, { useEffect, useRef, useState } from 'react';
import regionsData from '@/lib/korea-regions.geo.json';

declare global {
  interface Window {
    kakao: any;
  }
}

interface RegionMapProps {
  center: [number, number];
  zoom: number;
  onRegionSelect: (code: string, name: string) => void;
  selectedRegionName: string | null;
}

const regionColors = {
    default: {
        fillColor: '#fff',
        fillOpacity: 0.6,
        strokeColor: '#333',
        strokeOpacity: 0.5,
        strokeWeight: 1,
    },
    hover: {
        fillOpacity: 0.8,
        strokeWeight: 2,
    },
    selected: {
        fillColor: '#1e90ff',
        fillOpacity: 0.8,
        strokeColor: '#0000ff',
        strokeWeight: 3,
    },
};

const RegionMap: React.FC<RegionMapProps> = ({ center, zoom, onRegionSelect, selectedRegionName }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const polygonsRef = useRef<any[]>([]);

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
          mapTypeId: window.kakao.maps.MapTypeId.ROADMAP,
          disableDoubleClickZoom: true,
        };

        const map = new window.kakao.maps.Map(mapContainerRef.current, mapOption);
        mapRef.current = map;
        
        displayArea(map);
      });
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&autoload=false&libraries=services,drawing`;
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        loadMap();
      };
      script.onerror = () => {
        console.error("Failed to load Kakao Maps script.");
      };
    } else if (window.kakao && window.kakao.maps) {
      loadMap();
    }
  }, [center, zoom]);


  const displayArea = (map: any) => {
    const features = (regionsData as any).features;
    polygonsRef.current.forEach(p => p.setMap(null)); // Clear existing polygons
    polygonsRef.current = [];

    features.forEach((feature: any) => {
      const coordinates = feature.geometry.coordinates;
      const name = feature.properties.nm;
      const code = feature.properties.code;
      
      let path = coordinates[0].map((coord: any) => new window.kakao.maps.LatLng(coord[1], coord[0]));
      if(feature.geometry.type === "MultiPolygon") {
          path = coordinates.flatMap((poly: any) => poly[0].map((coord: any) => new window.kakao.maps.LatLng(coord[1], coord[0])));
          // Note: This simplification for MultiPolygon might not be perfect for all cases.
          // A more robust solution would create multiple polygon objects for a single feature.
      }


      const polygon = new window.kakao.maps.Polygon({
        map: map,
        path: path,
        ...regionColors.default
      });

      polygon.setOptions({
        fillColor: name === selectedRegionName ? regionColors.selected.fillColor : regionColors.default.fillColor
      });

      polygonsRef.current.push({polygon, name});
      
      window.kakao.maps.event.addListener(polygon, 'mouseover', () => {
        if(name !== selectedRegionName) {
            polygon.setOptions(regionColors.hover);
        }
      });
      
      window.kakao.maps.event.addListener(polygon, 'mouseout', () => {
        if(name !== selectedRegionName) {
            polygon.setOptions({
                ...regionColors.default,
                fillColor: name === selectedRegionName ? regionColors.selected.fillColor : regionColors.default.fillColor,
            });
        }
      });
      
      window.kakao.maps.event.addListener(polygon, 'click', () => {
        onRegionSelect(code, name);
      });
    });
  };

  useEffect(() => {
    polygonsRef.current.forEach(({ polygon, name }) => {
        const isSelected = name === selectedRegionName;
        polygon.setOptions({
            fillColor: isSelected ? regionColors.selected.fillColor : regionColors.default.fillColor,
            fillOpacity: isSelected ? regionColors.selected.fillOpacity : regionColors.default.fillOpacity,
            strokeWeight: isSelected ? regionColors.selected.strokeWeight : regionColors.default.strokeWeight,
            strokeColor: isSelected ? regionColors.selected.strokeColor : regionColors.default.strokeColor,
        });
    });
  }, [selectedRegionName]);


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
