import React from 'react';
import { MapPin, Square, Eye, ShoppingCart } from 'lucide-react';
import { Plot } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { getStatusColor, getStatusText, isPlotAvailableForPurchase } from '../../utils/plotStatus';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

interface PlotCardProps {
  plot: Plot;
  onViewDetails: (plot: Plot) => void;
}

export const PlotCard: React.FC<PlotCardProps> = ({ plot, onViewDetails }) => {
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlotAvailableForPurchase(plot)) {
      addToCart(plot);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image */}
      <div className="h-48 bg-gray-200 relative overflow-hidden">
        {plot.image_urls && plot.image_urls.length > 0 ? (
          <img
            src={plot.image_urls[0]}
            alt={plot.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
            <MapPin className="w-16 h-16 text-blue-400" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plot.status)}`}>
            {getStatusText(plot.status)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
            {plot.title}
          </h3>
          <span className="text-xl font-bold text-blue-600 ml-2">
            {formatCurrency(plot.price)}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {plot.description}
        </p>

        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Square className="w-4 h-4 mr-1" />
            <span>{plot.area_sqm.toLocaleString()} sqm</span>
          </div>
          {plot.council && (
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{plot.council.name}</span>
            </div>
          )}
        </div>

        {/* Usage Type */}
        {plot.usage_type && (
          <div className="mb-4">
            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
              {plot.usage_type}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => onViewDetails(plot)}
            className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </button>
          
          {user && isPlotAvailableForPurchase(plot) && (
            <button
              onClick={handleAddToCart}
              disabled={isInCart(plot.id)}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md transition-colors ${
                isInCart(plot.id)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <ShoppingCart className="w-4 h-4 mr-1" />
              {isInCart(plot.id) ? 'In Cart' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};