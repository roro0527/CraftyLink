
'use client';

import React, { useEffect, useRef } from 'react';
import geoJsonData from '@/lib/korea-regions.geo.json';

declare global {
  interface Window {
    kakao: any;
  }
}

interface RegionMapProps {
  center: [number, number];
  zoom: number;
  onRegionSelect: (name: string, code: string) => void;
  selectedRegionName: string;
}

const regionColors: { [key: string]: string } = {
  '서울특별시': '#ff6b6b',
  '부산광역시': '#f06595',
  '대구광역시': '#cc5de8',
  '인천광역시': '#845ef7',
  '광주광역시': '#5c7cfa',
  '대전광역시': '#339af0',
  '울산광역시': '#22b8cf',
  '세종특별자치시': '#20c997',
  '경기도': '#51cf66',
  '강원특별자치도': '#94d82d',
  '충청북도': '#fcc419',
  '충청남도': '#ff922b',
  '전북특별자치도': '#ff6b6b',
  '전라남도': '#f06595',
  '경상북도': '#cc5de8',
  '경상남도': '#845ef7',
  '제주특별자치도': '#5c7cfa',
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
        if (!mapContainerRef.current) return;
        
        if (mapRef.current) return; // Map already loaded

        const mapOption = {
          center: new window.kakao.maps.LatLng(center[0], center[1]),
          level: zoom,
          disableDoubleClickZoom: true,
        };

        mapRef.current = new window.kakao.maps.Map(mapContainerRef.current, mapOption);

        const drawnPolygons = geoJsonData.features.flatMap((feature) => {
          const regionName = feature.properties.nm;
          const regionCode = feature.properties.code;
          const coordinates = feature.geometry.coordinates;
          const geometryType = feature.geometry.type;

          let paths: any[] = [];
          if (geometryType === 'Polygon') {
            paths = [coordinates[0].map((p: [number, number]) => new window.kakao.maps.LatLng(p[1], p[0]))];
          } else if (geometryType === 'MultiPolygon') {
            paths = coordinates.map((poly: any[][]) =>
              poly[0].map((p: [number, number]) => new window.kakao.maps.LatLng(p[1], p[0]))
            );
          }

          return paths.map(path => {
            const polygon = new window.kakao.maps.Polygon({
              map: mapRef.current,
              path: path,
              strokeWeight: 1.5,
              strokeColor: '#fff',
              strokeOpacity: 0.8,
              fillColor: regionColors[regionName] || '#999',
              fillOpacity: 0.6,
            });

            (polygon as any).regionName = regionName;

            window.kakao.maps.event.addListener(polygon, 'click', () => {
              onRegionSelect(regionName, regionCode);
            });

            window.kakao.maps.event.addListener(polygon, 'mouseover', () => {
              if (regionName !== selectedRegionName) {
                polygon.setOptions({ fillOpacity: 0.8 });
              }
            });

            window.kakao.maps.event.addListener(polygon, 'mouseout', () => {
                if (regionName !== selectedRegionName) {
                polygon.setOptions({ fillOpacity: 0.6 });
              }
            });
            return polygon;
          });
        }).flat();
        polygonsRef.current = drawnPolygons;
      });
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`;
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        loadMap();
      };
      script.onerror = () => {
        console.error("Failed to load Kakao Maps script.");
      }
    } else if (window.kakao && window.kakao.maps) {
        loadMap();
    }
  }, [center, zoom, onRegionSelect, selectedRegionName]);


  useEffect(() => {
    // This effect handles highlighting the selected region
    if (polygonsRef.current.length === 0 || !selectedRegionName) return;

    polygonsRef.current.forEach(p => {
      const isSelected = (p as any).regionName === selectedRegionName;
      p.setOptions({
        fillOpacity: isSelected ? 0.9 : 0.6,
        strokeWeight: isSelected ? 3 : 1.5,
        strokeColor: isSelected ? '#333' : '#fff'
      });
    });
  }, [selectedRegionName]);

  useEffect(() => {
    // This effect handles map resizing
    const handleResize = () => {
        if (mapRef.current) {
            mapRef.current.relayout();
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%', borderRadius: 'inherit' }} />;
};

export default RegionMap;
