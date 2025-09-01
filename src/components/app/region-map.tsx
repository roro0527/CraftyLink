
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
    const mapInstanceRef = React.useRef<L.Map | null>(null);

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
            
            const style = () => ({
                fillColor: '#3388ff',
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.5
            });

            let selectedLayer: L.Layer | null = null;
            const geojsonLayer = L.geoJSON(regionsData as any);

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

            const resetHighlight = (e: L.LeafletMouseEvent) => {
                if (e.target !== selectedLayer) {
                   geojsonLayer.resetStyle(e.target);
                }
            };
            
            const onEachFeature = (feature: RegionFeature, layer: Layer) => {
                layer.on({
                    mouseover: highlightFeature,
                    mouseout: resetHighlight,
                    click: (e) => {
                        if (selectedLayer) {
                            geojsonLayer.resetStyle(selectedLayer as L.Path);
                        }
                        selectedLayer = e.target;
                         e.target.setStyle({
                            weight: 3,
                            color: '#e60000',
                            fillOpacity: 0.8
                        });

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
    }, [center, zoom, onRegionClick]);

    return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default RegionMap;
