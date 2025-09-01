
'use client';

import * as React from 'react';
import type { Layer, Feature as GeoJSONFeature } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import regionsData from '@/lib/korea-regions.geo.json';

interface RegionMapProps {
    onRegionClick: (region: { name: string; code: string }) => void;
}

interface RegionProperties {
    CTP_KOR_NM: string;
    CTPRVN_CD: string;
}

type RegionFeature = GeoJSONFeature<GeoJSON.Point, RegionProperties>;


const RegionMap: React.FC<RegionMapProps> = ({ onRegionClick }) => {
    const mapRef = React.useRef<HTMLDivElement>(null);
    // Use a ref to store the map instance. This prevents it from being recreated on re-renders.
    const mapInstanceRef = React.useRef<L.Map | null>(null);

    React.useEffect(() => {
        // Only initialize the map if the ref is attached to a div and the map is not already initialized.
        if (mapRef.current && !mapInstanceRef.current) {
            const map = L.map(mapRef.current, {
                center: [36.5, 127.5],
                zoom: 7,
                scrollWheelZoom: true,
            });
            mapInstanceRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            const style = (feature?: RegionFeature) => {
                return {
                    fillColor: '#3388ff',
                    weight: 2,
                    opacity: 1,
                    color: 'white',
                    dashArray: '3',
                    fillOpacity: 0.5
                };
            };

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

        // Cleanup function: remove the map instance when the component unmounts.
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [onRegionClick]); // Dependency array is important

    return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default RegionMap;
