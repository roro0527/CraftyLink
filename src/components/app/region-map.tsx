
'use client';

import * as React from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import type { LatLngExpression } from 'leaflet';

interface RegionMapProps {
    onCreated: (e: any) => void;
    onDeleted: (e: any) => void;
}

const RegionMap: React.FC<RegionMapProps> = ({ onCreated, onDeleted }) => {
    const center: LatLngExpression = [37.5665, 126.9780];

    return (
        <MapContainer center={center} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FeatureGroup>
                <EditControl
                    position="topright"
                    onCreated={onCreated}
                    onDeleted={onDeleted}
                    draw={{
                        rectangle: false,
                        circlemarker: false,
                        circle: false,
                        marker: false,
                        polyline: false,
                        polygon: true,
                    }}
                />
            </FeatureGroup>
        </MapContainer>
    );
};

export default RegionMap;
