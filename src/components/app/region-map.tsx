
'use client';

import * as React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { LatLngExpression, Layer, Feature as GeoJSONFeature } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
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
    
    const displayMap = React.useMemo(
        () => {
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

            const resetHighlight = (e: L.LeafletMouseEvent) => {
                (e.target as any)._map.eachLayer((layer: any) => {
                    if (layer.feature && layer.feature.properties.CTPRVN_CD === e.target.feature.properties.CTPRVN_CD) {
                        (layer as L.GeoJSON).resetStyle(e.target);
                    }
                });
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

            return (
                <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <GeoJSON 
                        data={regionsData as any} 
                        style={style} 
                        onEachFeature={onEachFeature as any} 
                    />
                </MapContainer>
            );
        },
        [center, zoom, onRegionClick]
    );

    return displayMap;
};

export default React.memo(RegionMap);
