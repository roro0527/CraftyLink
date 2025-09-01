
'use client';

import 'leaflet/dist/leaflet.css';
import * as React from 'react';
import L, { type LatLngExpression, type Layer, type GeoJsonObject } from 'leaflet';
import geoJsonData from '@/lib/korea-regions.geo.json';

// Fix for broken leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'leaflet/dist/images/marker-icon-2x.png',
  iconUrl: 'leaflet/dist/images/marker-icon.png',
  shadowUrl: 'leaflet/dist/images/marker-shadow.png',
});


const regionColors: { [key: string]: string } = {
  "서울특별시": "#b4d379",
  "경기도": "#e0e567",
  "인천광역시": "#c7d99f",
  "강원도": "#96c457",
  "충청북도": "#9ac28f",
  "세종특별자치시": "#79b4a9",
  "대전광역시": "#79b4a9",
  "충청남도": "#93d4ca",
  "경상북도": "#4e98b3",
  "대구광역시": "#4c8a98",
  "울산광역시": "#547fec",
  "부산광역시": "#335be3",
  "경상남도": "#e68b8b",
  "전라북도": "#f9c859",
  "광주광역시": "#f9c859",
  "전라남도": "#f9a96b",
  "제주특별자치도": "#c999d9",
};

const defaultStyle = {
  weight: 2,
  opacity: 1,
  color: 'white',
  fillOpacity: 0.7,
};

const hoverStyle = {
  weight: 3,
  color: '#FFF',
  fillOpacity: 0.9,
};

const clickStyle = {
    weight: 4,
    color: '#333',
    fillOpacity: 1,
};

interface RegionMapProps {
  center: LatLngExpression;
  zoom: number;
  onRegionClick: (regionName: string, regionCode: string) => void;
}

const RegionMap: React.FC<RegionMapProps> = ({ center, zoom, onRegionClick }) => {
    const mapRef = React.useRef<HTMLDivElement>(null);
    const mapInstanceRef = React.useRef<L.Map | null>(null);
    const geoJsonLayerRef = React.useRef<L.GeoJSON | null>(null);
    const [selectedRegion, setSelectedRegion] = React.useState<Layer | null>(null);

    React.useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            const map = L.map(mapRef.current, {
                center: center,
                zoom: zoom,
                zoomControl: false,
                dragging: false,
                scrollWheelZoom: false,
                doubleClickZoom: false,
                touchZoom: false,
                boxZoom: false,
                keyboard: false,
            });
            mapInstanceRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            const onEachFeature = (feature: GeoJsonObject['features'][0], layer: Layer) => {
                layer.bindTooltip(feature.properties.CTP_KOR_NM, {
                    permanent: true,
                    direction: 'center',
                    className: 'region-label',
                    offset: [0, 0],
                });

                layer.on({
                    mouseover: (e) => {
                        const targetLayer = e.target;
                        if (targetLayer !== selectedRegion) {
                            targetLayer.setStyle(hoverStyle);
                        }
                    },
                    mouseout: (e) => {
                         if (selectedRegion !== e.target && geoJsonLayerRef.current) {
                             geoJsonLayerRef.current.resetStyle(e.target);
                         }
                    },
                    click: (e) => {
                        if (selectedRegion && geoJsonLayerRef.current) {
                            geoJsonLayerRef.current.resetStyle(selectedRegion as Layer);
                        }
                        const targetLayer = e.target;
                        targetLayer.setStyle(clickStyle);
                        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                            targetLayer.bringToFront();
                        }
                        setSelectedRegion(targetLayer);
                        const { CTP_KOR_NM, CTPRVN_CD } = feature.properties;
                        onRegionClick(CTP_KOR_NM, `KR-${CTPRVN_CD}`);
                    },
                });
            }

            const geoJsonStyle = (feature?: GeoJsonObject['features'][0]) => {
                const regionName = feature?.properties.CTP_KOR_NM;
                return {
                    ...defaultStyle,
                    fillColor: regionColors[regionName] || '#9e9e9e',
                };
            }

            geoJsonLayerRef.current = L.geoJSON(geoJsonData as GeoJsonObject, {
                style: geoJsonStyle,
                onEachFeature: onEachFeature
            }).addTo(map);
        }
        
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center, zoom, onRegionClick]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default React.memo(RegionMap);
