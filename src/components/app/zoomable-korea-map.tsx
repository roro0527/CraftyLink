
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

const KoreaMapSVG = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 500 600"
    className="w-full h-full"
    aria-label="Map of South Korea"
  >
    <path
      d="M321.3,58.3L321.3,58.3C318,52.4,316,46,315.7,39.4c-0.2-4.1,2.5-7.8,6.5-8.6c4-0.8,8,1.7,9.1,5.5
      c1,3.4-0.1,7.2-2.9,9.6c-0.2,0.2-0.5,0.3-0.7,0.5c-3.1,2.5-5.6,5.6-7.5,9.1l-10.7,20.4c-0.8,1.6-1.5,3.2-2.1,4.9
      c-3.4,9.6-6.1,19.3-8.1,29.2c-0.8,4.1-1.4,8.1-1.9,12.2c-0.7,5.5-1.1,11-1.3,16.5c-0.3,5.9-0.2,11.8,0.2,17.7
      c0.4,5.4,1.1,10.7,2.2,16c2.5,12,6.1,23.6,10.6,34.8c1.3,3.3,2.8,6.5,4.4,9.7c5.8,11.4,12.5,22.3,19.9,32.8
      c2.5,3.6,5.1,7.1,7.8,10.5c4.7,5.9,9.6,11.6,14.8,17c1.3,1.4,2.6,2.7,3.9,4c4.1,4.3,8.3,8.4,12.5,12.5
      c2.1,2.1,4.2,4.1,6.3,6.2c9.5,9.2,18.7,18.8,26.9,29.1c3.5,4.4,6.7,9,9.5,13.8c4.2,7.3,7.4,15,9.5,23.1
      c1.1,4.1,1.9,8.2,2.3,12.4c0.5,4.7,0.5,9.4,0,14.1c-0.5,4.6-1.5,9.1-2.9,13.5c-0.9,2.8-2,5.6-3.3,8.3
      c-2.4,5-5.4,9.7-8.9,14.1c-5,6.2-11,11.7-17.7,16.5c-3.1,2.2-6.4,4.2-9.7,6c-4.4,2.4-8.9,4.4-13.5,6.1
      c-5.8,2.1-11.7,3.6-17.7,4.5c-5.1,0.8-10.2,1-15.3,0.7c-7.9-0.5-15.7-1.8-23.4-3.9c-8-2.2-15.9-5.1-23.5-8.7
      c-7.2-3.4-14.2-7.4-20.9-12c-4.7-3.2-9.2-6.7-13.6-10.4c-6.1-5.1-11.9-10.7-17.3-16.7c-5.1-5.7-9.8-11.8-14-18.3
      c-4-6.1-7.5-12.5-10.5-19.1c-3.1-6.8-5.7-13.8-7.7-21c-1.8-6.3-3-12.7-3.6-19.1c-0.7-6.9-0.7-13.8-0.1-20.8
      c0.6-7.3,1.9-14.6,3.9-21.7c0.6-2,1.2-4,1.8-6c1.1-3.6,2.3-7.1,3.6-10.6c0.6-1.6,1.2-3.2,1.8-4.8l0.2-0.5
      c2.1-5.5,4.4-10.9,7-16.2c0.2-0.5,0.5-1,0.7-1.5l14.4-31.1c0.1-0.2,0.2-0.3,0.3-0.5l19.5-40.4c0-0.1,0-0.1,0-0.2l20-39.7
      c0,0,0-0.1,0-0.1l11-21.3c0,0,0,0,0-0.1c4.6-9.1,9.6-17.9,15.1-26.4c0.9-1.4,1.8-2.8,2.8-4.1c1.8-2.6,3.7-5.1,5.6-7.6
      c2.9-3.7,6-7.2,9.2-10.6c2.4-2.5,4.8-4.9,7.3-7.2L321.3,58.3z"
      fill="#a0aec0"
      stroke="#4a5568"
      strokeWidth="2"
    />
    <path
      d="M100.8,477.7c-2.3,1.3-4.9,1.8-7.5,1.5c-4.7-0.5-8.5-4.4-8.8-9.1c-0.3-4.7,2.8-8.9,7.4-9.6c1.1-0.2,2.2-0.1,3.2,0.1
      c6.6,1.4,12.5,4.6,17.4,9C110.1,472.9,106.3,476,100.8,477.7z"
      fill="#a0aec0"
      stroke="#4a5568"
      strokeWidth="2"
    />
  </svg>
);

const ZoomableKoreaMap: React.FC = () => {
  const [scale, setScale] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const mapRef = React.useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale * 1.2, 5));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale / 1.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-gray-100 flex items-center justify-center">
      <div
        ref={mapRef}
        className="absolute transition-transform duration-300 ease-in-out"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          cursor: 'grab',
        }}
      >
        <KoreaMapSVG />
      </div>
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <Button size="icon" onClick={handleZoomIn} aria-label="Zoom In">
          <ZoomIn className="w-5 h-5" />
        </Button>
        <Button size="icon" onClick={handleZoomOut} aria-label="Zoom Out">
          <ZoomOut className="w-5 h-5" />
        </Button>
        <Button size="icon" onClick={handleReset} aria-label="Reset View">
          <RefreshCw className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default ZoomableKoreaMap;
