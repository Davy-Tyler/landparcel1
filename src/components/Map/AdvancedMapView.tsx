import React, { useEffect, useRef } from 'react';
import { Plot } from '../../types';

interface AdvancedMapViewProps {
  plots: Plot[];
  onPlotClick?: (plot: Plot) => void;
  className?: string;
  enableDrawing?: boolean;
  enableSearch?: boolean;
}

export const AdvancedMapView: React.FC<AdvancedMapViewProps> = ({
  plots,
  onPlotClick,
  className = "w-full h-full",
  enableDrawing = false,
  enableSearch = false,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Clean up existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const L = (window as any).L;
    if (!L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapRef.current) return;

      mapRef.current.innerHTML = '';

      const map = L.map(mapRef.current).setView([-6.8, 39.25], 11);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      plots.forEach(plot => {
        const color = plot.status === 'available' ? '#10B981' : 
                     plot.status === 'locked' ? '#F59E0B' : '#6B7280';
        
        const marker = L.circleMarker(plot.coordinates, {
          radius: 8,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map);

        marker.on('click', () => {
          if (onPlotClick) {
            onPlotClick(plot);
          }
        });

        marker.bindTooltip(plot.title, {
          permanent: false,
          direction: 'top',
          offset: [0, -10]
        });
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [plots, onPlotClick]);

  return <div ref={mapRef} className={className} />;
};