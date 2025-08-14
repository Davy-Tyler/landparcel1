import React from 'react';
import { X, MapPin, Square, DollarSign, Calendar, User } from 'lucide-react';
import { Plot } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { getStatusColor, getStatusText, isPlotAvailableForPurchase } from '../../utils/plotStatus';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

interface PlotDetailsModalProps {
  plot: Plot;
  isOpen: boolean;
  onClose: () => void;
}

export const PlotDetailsModal: React.FC<PlotDetailsModalProps> = ({
  plot,
  isOpen,
  onClose,
}) => {
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleAddToCart = () => {
    if (isPlotAvailableForPurchase(plot)) {
      addToCart(plot);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{plot.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Images */}
            <div>
              {plot.image_urls && plot.image_urls.length > 0 ? (
                <div className="space-y-4">
                  <img
                    src={plot.image_urls[0]}
                    alt={plot.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  {plot.image_urls.length > 1 && (
                    <div className="grid grid-cols-3 gap-2">
                      {plot.image_urls.slice(1, 4).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`${plot.title} ${index + 2}`}
                          className="w-full h-20 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <MapPin className="w-16 h-16 text-blue-400" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              {/* Price and Status */}
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(plot.price)}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(plot.status)}`}>
                  {getStatusText(plot.status)}
                </span>
              </div>

              {/* Key Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Square className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Area</p>
                    <p className="font-semibold">{plot.area_sqm.toLocaleString()} sqm</p>
                  </div>
                </div>

                {plot.usage_type && (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Usage Type</p>
                      <p className="font-semibold">{plot.usage_type}</p>
                    </div>
                  </div>
                )}

                {plot.council && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-semibold">{plot.council.name}</p>
                      {plot.council.district && (
                        <p className="text-sm text-gray-500">
                          {plot.council.district.name}
                          {plot.council.district.region && `, ${plot.council.district.region.name}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Listed</p>
                    <p className="font-semibold">
                      {new Date(plot.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {plot.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 leading-relaxed">{plot.description}</p>
                </div>
              )}

              {/* Plot Number */}
              {plot.plot_number && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Plot Number</h3>
                  <p className="text-gray-600 font-mono">{plot.plot_number}</p>
                </div>
              )}

              {/* Actions */}
              {user && isPlotAvailableForPurchase(plot) && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleAddToCart}
                    disabled={isInCart(plot.id)}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      isInCart(plot.id)
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isInCart(plot.id) ? 'Already in Cart' : 'Add to Cart'}
                  </button>
                </div>
              )}

              {!user && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-center text-gray-600 mb-4">
                    Please log in to add plots to your cart
                  </p>
                  <div className="flex space-x-4">
                    <a
                      href="/login"
                      className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
                    >
                      Login
                    </a>
                    <a
                      href="/register"
                      className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold text-center hover:bg-gray-300 transition-colors"
                    >
                      Register
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};