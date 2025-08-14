import React from 'react';
import { Plot } from '../../types';
import { PlotCard } from './PlotCard';

interface PlotGridProps {
  plots: Plot[];
  loading?: boolean;
  onViewDetails: (plot: Plot) => void;
}

export const PlotGrid: React.FC<PlotGridProps> = ({ plots, loading, onViewDetails }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (plots.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No plots found matching your criteria.</div>
        <p className="text-gray-400 mt-2">Try adjusting your search filters or browse all available plots.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plots.map((plot) => (
        <PlotCard
          key={plot.id}
          plot={plot}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};