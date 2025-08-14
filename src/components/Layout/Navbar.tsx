import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, ShoppingCart, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <MapPin className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">LandHub Tanzania</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {t('nav.browse_plots')}
            </Link>
            <Link 
              to="/map" 
              className="text-gray-700 hover:text-blue-600 transition-colors"
            >
              {t('nav.map_view')}
            </Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <LanguageSelector />
            
            {user ? (
              <>
                {/* Cart */}
                <Link 
                  to="/cart" 
                  className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </Link>

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 text-gray-700 hover:text-blue-600 transition-colors">
                    <User className="w-6 h-6" />
                    <span className="hidden md:inline">
                      {user.first_name || 'User'}
                    </span>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link 
                      to="/dashboard" 
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {t('nav.dashboard')}
                    </Link>
                    
                    {(user.role === 'admin' || user.role === 'master_admin') && (
                      <Link 
                        to="/admin" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        {t('nav.admin_panel')}
                      </Link>
                    )}
                    
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};