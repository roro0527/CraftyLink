
'use client';

import * as React from 'react';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet-draw';

interface RegionMapProps {
    center: LatLngExpression;
    zoom: number;
    onCreated: (e: any) => void;
    onDeleted: (e: any) => void;
}

const RegionMap: React.FC<RegionMapProps> = ({ center, zoom, onCreated, onDeleted }) => {
    const mapRef = React.useRef<HTMLDivElement>(null);
    const mapInstanceRef = React.useRef<L.Map | null>(null);

    React.useEffect(() => {
        if (mapRef.current && !mapInstanceRef.current) {
            // Check if map is already initialized on the container
            if ((mapRef.current as any)._leaflet_id) {
                return;
            }

            const map = L.map(mapRef.current).setView(center, zoom);
            mapInstanceRef.current = map;

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            const drawnItems = new L.FeatureGroup();
            map.addLayer(drawnItems);

            const drawControl = new L.Control.Draw({
                position: 'topright',
                draw: {
                    polygon: true,
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                    polyline: false,
                },
                edit: {
                    featureGroup: drawnItems
                }
            });
            map.addControl(drawControl);

            map.on(L.Draw.Event.CREATED, (event: any) => {
                const layer = event.layer;
                drawnItems.addLayer(layer);
                onCreated(event);
            });
            
            map.on('draw:deleted', (event: any) => {
                onDeleted(event);
            });
        }
        
        // Cleanup function to destroy the map instance
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [center, zoom, onCreated, onDeleted]);

  return (
    <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
  );
};

export default RegionMap;
