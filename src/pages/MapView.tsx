import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '../components/Layout/Layout';
import { PlotPopup } from '../components/Map/PlotPopup';
import { samplePlots } from '../data/samplePlots';
import { Plot } from '../types';
import { Search, Filter, X, SlidersHorizontal, MapPin } from 'lucide-react';

// Fixed map component that prevents initialization errors
const SimpleMap: React.FC<{ plots: Plot[] }> = ({ plots }) => {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Clean up existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const initializeMap = () => {
      const L = (window as any).L;
      
      if (!L || !mapRef.current) {
        console.warn('Leaflet not loaded or map container not ready');
        return;
      }

      try {
        mapRef.current.innerHTML = '';

        const map = L.map(mapRef.current).setView([-6.8, 39.25], 11);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add markers for plots
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

          marker.bindPopup(`
            <div class="p-3 min-w-[250px]">
              <h3 class="font-bold text-lg mb-2">${plot.title}</h3>
              <p class="text-sm text-gray-600 mb-2">${plot.location.name}</p>
              <p class="text-xl font-bold text-green-600 mb-2">${formatPrice(plot.price)}</p>
              <p class="text-sm"><strong>Area:</strong> ${plot.area_sqm.toLocaleString()} sqm</p>
              <p class="text-sm"><strong>Type:</strong> ${plot.usage_type}</p>
              <p class="text-sm"><strong>Status:</strong> ${plot.status}</p>
            </div>
          `);
        });
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    function formatPrice(price: number) {
      return new Intl.NumberFormat('en-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0,
      }).format(price);
    }

    const L = (window as any).L;
    if (!L) {
      // Load Leaflet CSS first
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Load Leaflet JS
      if (!document.querySelector('script[src*="leaflet.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          setTimeout(initializeMap, 100);
        };
        script.onerror = () => {
          console.error('Failed to load Leaflet');
        };
        document.head.appendChild(script);
      } else {
        setTimeout(initializeMap, 100);
      }
    } else {
      initializeMap();
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('Error removing map:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [plots]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export const MapView: React.FC = () => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [filteredPlots, setFilteredPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedUsageType, setSelectedUsageType] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  useEffect(() => {
    const loadPlots = async () => {
      try {
        // Try to fetch from backend, fallback to sample data
        const response = await fetch('http://localhost:8000/api/plots?status=available');
        if (response.ok) {
          const data = await response.json();
          setPlots(data);
          setFilteredPlots(data);
        } else {
          throw new Error('Backend not available');
        }
      } catch (error) {
        console.log('Backend not available, using sample data');
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPlots(samplePlots);
        setFilteredPlots(samplePlots);
      } finally {
        setLoading(false);
      }
    };

    loadPlots();
  }, []);

  useEffect(() => {
    let filtered = plots;

    if (searchTerm) {
      filtered = filtered.filter(plot =>
        plot.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plot.location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plot.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(plot => plot.status === selectedStatus);
    }

    if (selectedUsageType !== 'all') {
      filtered = filtered.filter(plot => plot.usage_type === selectedUsageType);
    }

    if (priceRange.min) {
      filtered = filtered.filter(plot => plot.price >= parseInt(priceRange.min));
    }

    if (priceRange.max) {
      filtered = filtered.filter(plot => plot.price <= parseInt(priceRange.max));
    }

    setFilteredPlots(filtered);
  }, [plots, searchTerm, selectedStatus, selectedUsageType, priceRange]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedUsageType('all');
    setPriceRange({ min: '', max: '' });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Loading interactive map...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 to-blue-50 overflow-hidden">
        <div className="flex h-full">
          {/* Enhanced Sidebar */}
          <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white/95 backdrop-blur-sm border-r border-gray-200/50 overflow-hidden shadow-lg`}>
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Filter className="w-4 h-4" />
                      </div>
                      <h2 className="text-lg font-bold">Search & Filter</h2>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="text-white/80 hover:text-white transition-colors p-1"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="bg-white/20 rounded-lg p-3">
                    <div className="text-2xl font-bold">{filteredPlots.length}</div>
                    <div className="text-white/90 text-sm">of {plots.length} plots shown</div>
                  </div>
                </div>
              </div>

              {/* Enhanced Filters */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Premium Search */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by location, type, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  />
                </div>

                {/* Price Range */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Price Range (TSH)</label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Min price"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                    />
                    <input
                      type="number"
                      placeholder="Max price"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="w-full px-3 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm bg-white"
                    />
                  </div>
                </div>

                {/* Filter Cards */}
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Property Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="available">✅ Available</option>
                      <option value="locked">🔒 In Cart</option>
                      <option value="sold">💰 Sold</option>
                    </select>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Usage Type</label>
                    <select
                      value={selectedUsageType}
                      onChange={(e) => setSelectedUsageType(e.target.value)}
                      className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                    >
                      <option value="all">All Types</option>
                      <option value="residential">🏡 Residential</option>
                      <option value="commercial">🏢 Commercial</option>
                      <option value="industrial">🏭 Industrial</option>
                      <option value="agricultural">🌾 Agricultural</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={clearFilters}
                  className="w-full bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  Clear All Filters
                </button>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">
                      {filteredPlots.filter(p => p.status === 'available').length}
                    </div>
                    <div className="text-emerald-100 text-xs">Available Plots</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold">
                      {(filteredPlots.reduce((sum, plot) => sum + plot.area_sqm, 0) / 1000).toFixed(1)}K
                    </div>
                    <div className="text-blue-100 text-xs">Total sqm</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Toggle Button */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute top-6 left-6 z-20 bg-white shadow-lg rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Map Container */}
          <div className="flex-1 relative">
            {/* Floating Info Card */}
            <div className="absolute top-6 right-6 z-[1000] bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 max-w-sm border border-white/20">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Dar es Salaam</h2>
                  <p className="text-sm text-gray-500">Premium Land Plots</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-600">{filteredPlots.length}</div>
                <div className="text-sm text-gray-600">Properties available</div>
              </div>
            </div>

            {/* Map */}
            <div className="h-full rounded-tl-2xl overflow-hidden">
              <SimpleMap plots={filteredPlots} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};