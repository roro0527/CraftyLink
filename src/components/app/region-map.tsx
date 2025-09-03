
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
    if (!window.kakao || !window.kakao.maps) return;

    window.kakao.maps.load(() => {
      const mapOption = {
        center: new window.kakao.maps.LatLng(center[0], center[1]),
        level: zoom,
      };
      
      if (mapContainerRef.current && !mapRef.current) {
        const map = new window.kakao.maps.Map(mapContainerRef.current, mapOption);
        mapRef.current = map;
        drawPolygons();
      }
    });
  }, [center, zoom]);


  useEffect(() => {
    // This effect handles highlighting the selected region
    if (!mapRef.current) return;
    
    polygonsRef.current.forEach(p => {
        const isSelected = p.regionName === selectedRegionName;
        p.setOptions({
            fillOpacity: isSelected ? 0.8 : 0.6,
            strokeWeight: isSelected ? 3 : 1.5,
            strokeColor: isSelected ? '#333' : '#fff'
        });
    });

  }, [selectedRegionName]);


  const drawPolygons = () => {
    const map = mapRef.current;
    if (!map) return;
    
    // Clear existing polygons
    polygonsRef.current.forEach(p => p.setMap(null));
    polygonsRef.current = [];

    geoJsonData.features.forEach((feature) => {
      const regionName = feature.properties.nm;
      const regionCode = feature.properties.code;
      const coordinates = feature.geometry.coordinates;
      const geometryType = feature.geometry.type;

      const paths = coordinates.map((coordSet: any) => {
          // For Polygon, coordSet is the ring. For MultiPolygon, it's a list of polygons.
          const ring = geometryType === 'Polygon' ? coordSet : coordSet[0];
          return ring.map((point: [number, number]) => new window.kakao.maps.LatLng(point[1], point[0]));
      });

      const polygonPaths = geometryType === 'Polygon' ? [paths] : paths;

      polygonPaths.forEach((path: any) => {
        const polygon = new window.kakao.maps.Polygon({
            map: map,
            path: path,
            strokeWeight: 1.5,
            strokeColor: '#fff',
            strokeOpacity: 0.8,
            fillColor: regionColors[regionName] || '#999',
            fillOpacity: 0.6,
        });

        (polygon as any).regionName = regionName;
        polygonsRef.current.push(polygon);

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

      });
    });
  };


  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%', borderRadius: 'inherit' }} />;
};

export default RegionMap;
