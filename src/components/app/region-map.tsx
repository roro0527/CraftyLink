
'use client';

import * as React from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { LatLngExpression, Layer, Feature } from 'leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import regionsData from '@/lib/korea-regions.geo.json';

interface RegionMapProps {
    center: LatLngExpression;
    zoom: number;
    onRegionClick: (region: { name: string; code: string }) => void;
}

const RegionMap: React.FC<RegionMapProps> = ({ center, zoom, onRegionClick }) => {
    
    const style = {
        fillColor: '#3388ff',
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0.5
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
        (e.target.getGeoJSON() as L.GeoJSON).resetStyle(e.target);
    };

    const onEachFeature = (feature: Feature, layer: Layer) => {
        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: (e) => {
                const properties = feature.properties;
                if (properties && properties.CTP_KOR_NM && properties.CTPRVN_CD) {
                   onRegionClick({ name: properties.CTP_KOR_NM, code: `KR-${properties.CTPRVN_CD}`});
                   // zoomToFeature(e);
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
                onEachFeature={onEachFeature} 
            />
        </MapContainer>
    );
};

export default RegionMap;
