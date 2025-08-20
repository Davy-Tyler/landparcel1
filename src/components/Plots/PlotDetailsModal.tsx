import React from 'react';
import { Plot } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { X, MapPin, Calendar, Ruler, ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlotDetailsModalProps {
  plot: Plot;
  isOpen: boolean;
  onClose: () => void;
}

export const PlotDetailsModal: React.FC<PlotDetailsModalProps> = ({
  plot,
  isOpen,
  onClose
}) => {
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleAddToCart = () => {
    addToCart(plot);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'locked':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sold':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUsageTypeColor = (usageType: string) => {
    switch (usageType) {
      case 'residential':
        return 'bg-blue-100 text-blue-800';
      case 'commercial':
        return 'bg-purple-100 text-purple-800';
      case 'industrial':
        return 'bg-orange-100 text-orange-800';
      case 'agricultural':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-gray-900 pr-4">
              {plot.title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4 mr-1" />
            {plot.location.name}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Price */}
          <div className="text-center py-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(plot.price)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {formatCurrency(plot.price / plot.area_sqm)} per sqm
            </div>
          </div>

          {/* Key Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <Ruler className="w-4 h-4 mr-2 text-gray-400" />
              <span>{plot.area_sqm.toLocaleString()} sqm</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-gray-400" />
              <span>{new Date(plot.listed_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Plot Number */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900 mb-1">Plot Number</div>
            <div className="text-sm text-gray-600">{plot.plot_number}</div>
          </div>

          {/* Status and Usage Type */}
          <div className="flex gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(plot.status)}`}>
              {plot.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getUsageTypeColor(plot.usage_type)}`}>
              {plot.usage_type.toUpperCase()}
            </span>
          </div>

          {/* Location Details */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900 mb-2">Location Details</div>
            <div className="space-y-1 text-sm text-gray-600">
              <div><strong>Region:</strong> {plot.location.region}</div>
              <div><strong>District:</strong> {plot.location.district}</div>
              <div><strong>Council:</strong> {plot.location.council}</div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900 mb-2">Description</div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {plot.description}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            <Link
              to={`/plots/${plot.id}`}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg text-sm text-center transition-colors flex items-center justify-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Full Details
            </Link>
            
            {user && plot.status === 'available' && !isInCart(plot.id) && (
              <button
                onClick={handleAddToCart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </button>
            )}
            
            {user && isInCart(plot.id) && (
              <div className="w-full bg-yellow-100 text-yellow-800 font-medium py-3 px-4 rounded-lg text-sm text-center">
                ✅ Added to Cart
              </div>
            )}
            
            {!user && (
              <Link
                to="/login"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-sm text-center transition-colors"
              >
                Login to Purchase
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};