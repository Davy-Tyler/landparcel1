import React from 'react';
import { Layout } from '../components/Layout/Layout';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Trash2, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { supabaseApiService } from '../services/supabaseApi';
import { useNotifications } from '../components/Notifications/NotificationService';

export const Cart: React.FC = () => {
  const { items, removeFromCart, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { addNotification } = useNotifications();

  const handleRemoveItem = (plotId: string) => {
    removeFromCart(plotId);
  };

  const handleCheckout = async () => {
    if (!user || items.length === 0) return;

    try {
      // Create orders for each plot in cart
      for (const item of items) {
        await supabaseApiService.createOrder(item.plot.id);
      }

      clearCart();
      addNotification({
        type: 'success',
        title: 'Orders Created Successfully!',
        message: 'An admin will contact you shortly to complete the purchase process.'
      });
    } catch (error) {
      console.error('Error during checkout:', error);
      addNotification({
        type: 'error',
        title: 'Checkout Failed',
        message: 'Failed to process checkout. Please try again.'
      });
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('nav.login')}</h1>
            <p className="text-gray-600">You need to be logged in to view your cart.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('cart.empty')}</h1>
            <p className="text-gray-600 mb-6">{t('cart.empty_subtitle')}</p>
            <a
              href="/"
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('nav.browse_plots')}
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('cart.title')}</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Cart Items */}
          <div className="divide-y divide-gray-200">
            {items.map((item, index) => (
              <div key={item.plot.id} className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {item.plot.image_urls && item.plot.image_urls.length > 0 ? (
                        <img
                          src={item.plot.image_urls[0]}
                          alt={item.plot.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ShoppingCart className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {item.plot.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.plot.area_sqm.toLocaleString()} sqm • {item.plot.usage_type}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Added {item.addedAt.toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(item.plot.price)}
                    </p>
                    <button
                      onClick={() => handleRemoveItem(item.plot.id)}
                      className="mt-2 flex items-center text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">{t('cart.total')}</span>
              <span className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalPrice)}
              </span>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => clearCart()}
                className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-md hover:bg-gray-300 transition-colors"
              >
                {t('cart.clear_cart')}
              </button>
              <button
                onClick={handleCheckout}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('cart.checkout')}
              </button>
            </div>

            <p className="text-sm text-gray-600 mt-4 text-center">
              {t('cart.checkout_note')}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};