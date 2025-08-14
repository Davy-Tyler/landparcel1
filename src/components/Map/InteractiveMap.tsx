import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plot } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useLanguage } from '../../contexts/LanguageContext';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface InteractiveMapProps {
  plots: Plot[];
  onPlotClick?: (plot: Plot) => void;
  className?: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  plots,
  onPlotClick,
  className = "w-full h-full",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map centered on Tanzania
    const map = L.map(mapRef.current).setView([-6.369028, 34.888822], 6);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Set bounds to Tanzania
    const tanzaniaBounds = L.latLngBounds(
      [-11.745, 29.327], // Southwest corner
      [-0.990, 40.444]   // Northeast corner
    );
    
    map.fitBounds(tanzaniaBounds);
    map.setMaxBounds(tanzaniaBounds);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add markers for plots
    plots.forEach(plot => {
      // For demo purposes, generate random coordinates within Tanzania
      // In a real app, you'd use the actual geom data from the plot
      const lat = -6.369028 + (Math.random() - 0.5) * 8; // Random lat within Tanzania
      const lng = 34.888822 + (Math.random() - 0.5) * 8; // Random lng within Tanzania

      const marker = L.marker([lat, lng])
        .bindPopup(`
          <div class="p-2 min-w-[200px]">
            <h3 class="font-semibold text-lg mb-2">${plot.title}</h3>
            <div class="space-y-1 text-sm">
              <p><strong>${t('plot.area')}:</strong> ${plot.area_sqm.toLocaleString()} sqm</p>
              <p><strong>${t('plot.price')}:</strong> ${formatCurrency(plot.price)}</p>
              ${plot.usage_type ? `<p><strong>${t('plot.usage_type')}:</strong> ${plot.usage_type}</p>` : ''}
              ${plot.location ? `<p><strong>${t('plot.location')}:</strong> ${plot.location.name}</p>` : ''}
            </div>
            <button 
              onclick="window.plotClickHandler('${plot.id}')"
              class="mt-3 w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
            >
              ${t('plot.view_details')}
            </button>
          </div>
        `)
        .addTo(mapInstanceRef.current);

      markersRef.current.push(marker);
    });

    // Set up global click handler for plot details
    (window as any).plotClickHandler = (plotId: string) => {
      const plot = plots.find(p => p.id === plotId);
      if (plot && onPlotClick) {
        onPlotClick(plot);
      }
    };

    return () => {
      delete (window as any).plotClickHandler;
    };
  }, [plots, onPlotClick, t]);

  return (
    <div className={className}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
};