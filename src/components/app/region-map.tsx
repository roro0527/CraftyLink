
'use client';

import * as React from 'react';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import type { LatLngExpression } from 'leaflet';

interface RegionMapProps {
  center: LatLngExpression;
  zoom: number;
  onCreated: (e: any) => void;
  onDeleted: (e: any) => void;
}

const RegionMap: React.FC<RegionMapProps> = ({ center, zoom, onCreated, onDeleted }) => {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
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
