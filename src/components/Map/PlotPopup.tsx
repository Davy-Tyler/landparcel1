import React from 'react';
import { Plot } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../utils/formatters';
import { MapPin, Calendar, Ruler, ShoppingCart, Eye, Heart, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlotPopupProps {
  plot: Plot;
  onClose: () => void;
}

export const PlotPopup: React.FC<PlotPopupProps> = ({ plot, onClose }) => {
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();

  const handleAddToCart = () => {
    addToCart(plot);
    onClose();
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return {
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-400',
          text: 'Available Now'
        };
      case 'locked':
        return {
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-400',
          text: 'In Cart'
        };
      case 'sold':
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
          text: 'Sold'
        };
      default:
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          dot: 'bg-gray-400',
          text: status
        };
    }
  };

  const getUsageTypeConfig = (usageType: string) => {
    switch (usageType) {
      case 'residential':
        return { color: 'bg-blue-50 text-blue-700', icon: '🏡', text: 'Residential' };
      case 'commercial':
        return { color: 'bg-purple-50 text-purple-700', icon: '🏢', text: 'Commercial' };
      case 'industrial':
        return { color: 'bg-orange-50 text-orange-700', icon: '🏭', text: 'Industrial' };
      case 'agricultural':
        return { color: 'bg-green-50 text-green-700', icon: '🌾', text: 'Agricultural' };
      default:
        return { color: 'bg-gray-50 text-gray-700', icon: '📍', text: usageType };
    }
  };

  const statusConfig = getStatusConfig(plot.status);
  const usageConfig = getUsageTypeConfig(plot.usage_type);

  return (
    <div className="w-[420px] bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
      {/* Hero Header with Image Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        
        {/* Property Image Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white/80 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-8 h-8" />
            </div>
            <div className="text-sm font-medium">Premium Location</div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 left-4">
          <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.color} backdrop-blur-sm`}>
            <div className={`w-2 h-2 rounded-full ${statusConfig.dot} mr-2`}></div>
            {statusConfig.text}
          </div>
        </div>

        {/* Usage Type Badge */}
        <div className="absolute top-4 right-4">
          <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${usageConfig.color} backdrop-blur-sm`}>
            <span className="mr-1">{usageConfig.icon}</span>
            {usageConfig.text}
          </div>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white leading-tight mb-1">
            {plot.title}
          </h3>
          <div className="flex items-center text-white/90 text-sm">
            <MapPin className="w-4 h-4 mr-1" />
            {plot.location.name}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-6">
        {/* Price Section */}
        <div className="text-center">
          <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {formatCurrency(plot.price)}
          </div>
          <div className="text-sm text-gray-500 font-medium mt-1">
            {(plot.price / plot.area_sqm).toLocaleString()} TSH per sqm
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center border border-blue-100">
            <Ruler className="w-6 h-6 mx-auto text-blue-600 mb-2" />
            <div className="text-lg font-bold text-gray-900">
              {plot.area_sqm.toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 font-medium">Square meters</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center border border-purple-100">
            <Calendar className="w-6 h-6 mx-auto text-purple-600 mb-2" />
            <div className="text-lg font-bold text-gray-900">
              {new Date(plot.listed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className="text-xs text-gray-600 font-medium">Listed date</div>
          </div>
        </div>

        {/* Plot Number */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <div className="text-sm font-semibold text-gray-700 mb-1">Plot Reference</div>
          <div className="text-gray-900 font-medium">{plot.plot_number}</div>
        </div>

        {/* Description */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm text-gray-700 leading-relaxed">
            {plot.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Link
              to={`/plots/${plot.id}`}
              className="flex-1 bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold py-3 px-4 rounded-xl text-sm text-center transition-all duration-200 flex items-center justify-center"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Link>
            
            <button className="bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-600 p-3 rounded-xl transition-all duration-200">
              <Heart className="w-4 h-4" />
            </button>
            
            <button className="bg-gray-100 hover:bg-blue-100 hover:text-blue-600 text-gray-600 p-3 rounded-xl transition-all duration-200">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
          
          {user && plot.status === 'available' && !isInCart(plot.id) && (
            <button
              onClick={handleAddToCart}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl text-sm transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </button>
          )}
          
          {user && isInCart(plot.id) && (
            <div className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-4 px-6 rounded-xl text-sm text-center shadow-lg">
              <div className="flex items-center justify-center">
                <span className="mr-2">✅</span>
                Successfully Added to Cart
              </div>
            </div>
          )}
          
          {!user && (
            <Link
              to="/login"
              className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl text-sm text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Login to Purchase
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
