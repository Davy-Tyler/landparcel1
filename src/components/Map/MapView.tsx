import React from 'react';
import { InteractiveMap } from './InteractiveMap';
import { Plot } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useLanguage } from '../../contexts/LanguageContext';

interface MapViewProps {
  plots: Plot[];
  onPlotClick?: (plot: Plot) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  plots,
  onPlotClick,
}) => {
  const { t } = useLanguage();

  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border-2 border-gray-200 overflow-hidden">
      <InteractiveMap
        plots={plots}
        onPlotClick={onPlotClick}
        className="w-full h-full"
      />
      
      {/* Overlay info */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <h3 className="font-semibold text-gray-800 mb-1">
          {t('map.showing_plots', { count: plots.length })}
        </h3>
        <p className="text-sm text-gray-600">
          {t('map.subtitle')}
        </p>
      </div>
    </div>
  );
};