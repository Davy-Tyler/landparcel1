import React, { useState } from 'react';
import { useEffect } from 'react';
import { Location } from '../../types';

interface SearchFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  locations?: Location[];
}

export interface FilterOptions {
  search?: string;
  region?: string;
  district?: string;
  council?: string;
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  minArea?: number;
  maxArea?: number;
  locationId?: string;
  usageType?: string;
  status?: string;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ onFilterChange, locations = [] }) => {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);

  useEffect(() => {
    // Fetch locations when component mounts
    const fetchLocations = async () => {
      try {
        const { apiService } = await import('../../services/api');
        const data = await apiService.getLocations();
        setAvailableLocations(data);
      } catch (error) {
        console.error('Error fetching locations:', error);
      }
    };
    
    if (locations.length === 0) {
      fetchLocations();
    } else {
      setAvailableLocations(locations);
    }
  }, [locations]);

  const handleFilterChange = (key: keyof FilterOptions, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Search Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Price Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Price (TSH)
          </label>
          <input
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.minPrice || ''}
            onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Price (TSH)
          </label>
          <input
            type="number"
            placeholder="∞"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.maxPrice || ''}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        {/* Size Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Size (sqm)
          </label>
          <input
            type="number"
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.minSize || ''}
            onChange={(e) => handleFilterChange('minSize', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Size (sqm)
          </label>
          <input
            type="number"
            placeholder="∞"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.maxSize || ''}
            onChange={(e) => handleFilterChange('maxSize', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
        </div>

        {/* Region Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Region
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.region || ''}
            onChange={(e) => handleFilterChange('region', e.target.value || undefined)}
          >
            <option value="">All Regions</option>
            {Array.from(new Set(availableLocations.map(l => l.hierarchy?.region).filter(Boolean))).map((region, index) => (
              <option key={index} value={region}>{region}</option>
            ))}
          </select>
        </div>

        {/* District Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            District
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.district || ''}
            onChange={(e) => handleFilterChange('district', e.target.value || undefined)}
          >
            <option value="">All Districts</option>
            {Array.from(new Set(
              availableLocations
                .filter(l => !filters.region || l.hierarchy?.region === filters.region)
                .flatMap(l => Object.keys(l.hierarchy?.districts || {}))
            )).map((district, index) => (
              <option key={index} value={district}>{district}</option>
            ))}
          </select>
        </div>

        {/* Council Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Council
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filters.council || ''}
            onChange={(e) => handleFilterChange('council', e.target.value || undefined)}
          >
            <option value="">All Councils</option>
            {Array.from(new Set(
              availableLocations
                .filter(l => 
                  (!filters.region || l.hierarchy?.region === filters.region) &&
                  (!filters.district || Object.keys(l.hierarchy?.districts || {}).includes(filters.district))
                )
                .flatMap(l => 
                  Object.entries(l.hierarchy?.districts || {})
                    .filter(([district]) => !filters.district || district === filters.district)
                    .flatMap(([, data]) => data?.councils || [])
                )
            )).map((council, index) => (
              <option key={index} value={council}>{council}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;