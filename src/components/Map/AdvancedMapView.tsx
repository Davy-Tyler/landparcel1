import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plot } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useLanguage } from '../../contexts/LanguageContext';
import { apiService } from '../../services/api';
import { Layers, Search, Filter } from 'lucide-react';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const polygonsRef = useRef<L.Polygon[]>([]);
  const drawingRef = useRef<L.Polygon | null>(null);
  const { t } = useLanguage();

  const [isDrawing, setIsDrawing] = useState(false);
  const [searchRadius, setSearchRadius] = useState(5);
  const [searchCenter, setSearchCenter] = useState<L.LatLng | null>(null);
  const [nearbyPlots, setNearbyPlots] = useState<Plot[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map centered on Tanzania
    const map = L.map(mapRef.current).setView([-6.369028, 34.888822], 6);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Add satellite layer option
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '© Esri',
      maxZoom: 19,
    });

    // Layer control
    const baseLayers = {
      'Street Map': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
      'Satellite': satelliteLayer
    };

    L.control.layers(baseLayers).addTo(map);

    // Set bounds to Tanzania
    const tanzaniaBounds = L.latLngBounds(
      [-11.745, 29.327], // Southwest corner
      [-0.990, 40.444]   // Northeast corner
    );
    
    map.fitBounds(tanzaniaBounds);
    map.setMaxBounds(tanzaniaBounds);

    // Add drawing functionality if enabled
    if (enableDrawing) {
      map.on('click', handleMapClick);
    }

    // Add search functionality if enabled
    if (enableSearch) {
      map.on('contextmenu', handleRightClick);
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [enableDrawing, enableSearch]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers and polygons
    markersRef.current.forEach(marker => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    polygonsRef.current.forEach(polygon => {
      mapInstanceRef.current?.removeLayer(polygon);
    });
    markersRef.current = [];
    polygonsRef.current = [];

    // Add markers and polygons for plots
    plots.forEach(plot => {
      // Generate random coordinates within Tanzania for demo
      const lat = -6.369028 + (Math.random() - 0.5) * 8;
      const lng = 34.888822 + (Math.random() - 0.5) * 8;

      // Create marker
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

      // Add polygon if plot has geometry
      if (plot.geom) {
        try {
          // In a real app, you'd parse the actual geometry from the database
          // For demo, create a small polygon around the marker
          const polygonCoords: [number, number][] = [
            [lat - 0.001, lng - 0.001],
            [lat - 0.001, lng + 0.001],
            [lat + 0.001, lng + 0.001],
            [lat + 0.001, lng - 0.001]
          ];

          const polygon = L.polygon(polygonCoords, {
            color: getPlotColor(plot.status),
            fillColor: getPlotColor(plot.status),
            fillOpacity: 0.3,
            weight: 2
          }).addTo(mapInstanceRef.current);

          polygon.bindTooltip(plot.title);
          polygonsRef.current.push(polygon);
        } catch (error) {
          console.warn('Error creating polygon for plot:', plot.id, error);
        }
      }
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

  const getPlotColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#10b981'; // green
      case 'locked':
        return '#f59e0b'; // yellow
      case 'pending_payment':
        return '#f97316'; // orange
      case 'sold':
        return '#6b7280'; // gray
      default:
        return '#3b82f6'; // blue
    }
  };

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!isDrawing || !mapInstanceRef.current) return;

    // Simple polygon drawing (in production, use Leaflet.draw)
    const latlng = e.latlng;
    
    if (!drawingRef.current) {
      // Start new polygon
      const polygon = L.polygon([latlng], {
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
        weight: 2
      }).addTo(mapInstanceRef.current);
      
      drawingRef.current = polygon;
    } else {
      // Add point to existing polygon
      const currentLatLngs = drawingRef.current.getLatLngs()[0] as L.LatLng[];
      currentLatLngs.push(latlng);
      drawingRef.current.setLatLngs(currentLatLngs);
    }
  };

  const handleRightClick = async (e: L.LeafletMouseEvent) => {
    if (!enableSearch) return;

    const latlng = e.latlng;
    setSearchCenter(latlng);

    try {
      const response = await apiService.getPlotsNearPoint(
        latlng.lat,
        latlng.lng,
        searchRadius
      );
      
      setNearbyPlots(response.plots);

      // Add search circle
      if (mapInstanceRef.current) {
        const circle = L.circle(latlng, {
          radius: searchRadius * 1000, // Convert km to meters
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.1,
          weight: 2
        }).addTo(mapInstanceRef.current);

        // Remove circle after 5 seconds
        setTimeout(() => {
          mapInstanceRef.current?.removeLayer(circle);
        }, 5000);
      }
    } catch (error) {
      console.error('Error searching nearby plots:', error);
    }
  };

  const finishDrawing = async () => {
    if (!drawingRef.current) return;

    const latlngs = drawingRef.current.getLatLngs()[0] as L.LatLng[];
    const coords = latlngs.map(latlng => [latlng.lng, latlng.lat]);

    try {
      const response = await apiService.getPlotsInArea(coords);
      console.log('Plots in drawn area:', response.plots);
      
      // You could emit an event or call a callback here
      if (onPlotClick) {
        // For demo, just click the first plot found
        if (response.plots.length > 0) {
          onPlotClick(response.plots[0]);
        }
      }
    } catch (error) {
      console.error('Error finding plots in area:', error);
    }

    setIsDrawing(false);
    drawingRef.current = null;
  };

  const clearDrawing = () => {
    if (drawingRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(drawingRef.current);
      drawingRef.current = null;
    }
    setIsDrawing(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        {enableDrawing && (
          <div className="bg-white rounded-lg shadow-lg p-2">
            <button
              onClick={() => setIsDrawing(!isDrawing)}
              className={`p-2 rounded ${
                isDrawing ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
              title="Draw area to search"
            >
              <Filter className="w-4 h-4" />
            </button>
            {isDrawing && (
              <div className="flex space-x-1 mt-2">
                <button
                  onClick={finishDrawing}
                  className="px-2 py-1 bg-green-600 text-white text-xs rounded"
                >
                  Finish
                </button>
                <button
                  onClick={clearDrawing}
                  className="px-2 py-1 bg-red-600 text-white text-xs rounded"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        )}

        {enableSearch && (
          <div className="bg-white rounded-lg shadow-lg p-2">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="number"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-16 px-2 py-1 text-xs border rounded"
                min="1"
                max="50"
              />
              <span className="text-xs text-gray-500">km</span>
            </div>
            {nearbyPlots.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                Found {nearbyPlots.length} nearby plots
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      {(enableDrawing || enableSearch) && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <div className="text-sm text-gray-700">
            {enableDrawing && (
              <p className="mb-1">• Click to draw search area</p>
            )}
            {enableSearch && (
              <p>• Right-click to search nearby plots</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};