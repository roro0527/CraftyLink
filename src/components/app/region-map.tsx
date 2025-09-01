
'use client';

import * as React from 'react';
import type { LatLngExpression, Layer } from 'leaflet';
import L, { type Feature as GeoJSONFeature } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import regionsData from '@/lib/korea-regions.geo.json';

interface RegionMapProps {
    center: LatLngExpression;
    zoom: number;
    onRegionClick: (region: { name: string; code: string }) => void;
}

interface RegionProperties {
    CTP_KOR_NM: string;
    CTPRVN_CD: string;
}

type RegionFeature = GeoJSONFeature<GeoJSON.Point, RegionProperties>;

const RegionMap: React.FC<RegionMapProps> = ({ center, zoom, onRegionClick }) => {
    const mapRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        let map: L.Map;
        if (mapRef.current && !mapRef.current._leaflet_id) {
            map = L.map(mapRef.current, {
                center: center,
                zoom: zoom,
                scrollWheelZoom: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            
            const style = () => ({
                fillColor: '#3388ff',
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.5
            });

            const highlightFeature = (e: L.LeafletMouseEvent) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 3,
                    color: '#005cbf',
                    fillOpacity: 0.7
                });
                if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                    layer.bringToFront();
                }
            };
            
            const geojsonLayer = L.geoJSON(regionsData as any);

            const resetHighlight = (e: L.LeafletMouseEvent) => {
                geojsonLayer.resetStyle(e.target);
            };
            
            const onEachFeature = (feature: RegionFeature, layer: Layer) => {
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight,
                    click: () => {
                        const properties = feature.properties;
                        if (properties && properties.CTP_KOR_NM && properties.CTPRVN_CD) {
                           onRegionClick({ name: properties.CTP_KOR_NM, code: `KR-${properties.CTPRVN_CD}`});
                        }
                    }
                });
            };

            geojsonLayer.setStyle(style);
            geojsonLayer.on('add', () => {
                 geojsonLayer.eachLayer((layer) => {
                    const feature = (layer as L.GeoJSON).feature as RegionFeature;
                    onEachFeature(feature, layer);
                 });
            });
            geojsonLayer.addTo(map);
        }

        return () => {
            if (mapRef.current && mapRef.current._leaflet_id) {
                const mapInstance = (mapRef.current as any)._leaflet_map;
                if (mapInstance) {
                    mapInstance.remove();
                }
            }
        };
    }, [center, zoom, onRegionClick]);

    return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default RegionMap;
