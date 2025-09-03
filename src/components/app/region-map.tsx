
'use client';

import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import React, { useEffect, useRef } from 'react';
import geoJsonData from '@/lib/korea-regions.geo.json';

// Leaflet's default icon paths might break in a Next.js environment.
// This code manually sets the icon paths to fix them.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapRef.current = map;
    }
  }, [center, zoom]);


  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (geoJsonLayerRef.current) {
        map.removeLayer(geoJsonLayerRef.current);
    }

    const geoJsonLayer = L.geoJSON(geoJsonData as any, {
      style: (feature) => {
        const regionName = feature?.properties.nm;
        const isSelected = regionName === selectedRegionName;
        return {
          fillColor: regionColors[regionName] || '#999',
          weight: isSelected ? 3 : 1.5,
          opacity: 1,
          color: isSelected ? '#333' : 'white',
          fillOpacity: isSelected ? 0.8 : 0.6,
        };
      },
      onEachFeature: (feature, layer) => {
        const regionName = feature.properties.nm;
        const regionCode = feature.properties.code;
        
        layer.on({
          click: () => {
             if (regionName && regionCode) {
               onRegionSelect(regionName, regionCode);
             }
          },
          mouseover: () => {
             layer.setStyle({
                weight: 3,
                fillOpacity: 0.8
             });
          },
          mouseout: () => {
            geoJsonLayer.resetStyle(layer);
          }
        });
      },
    }).addTo(map);

    geoJsonLayerRef.current = geoJsonLayer;

  }, [onRegionSelect, selectedRegionName]);


  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%', borderRadius: 'inherit' }} />;
};

export default RegionMap;
