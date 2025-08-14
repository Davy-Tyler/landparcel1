import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Plot, CartItem } from '../types';
import { supabaseApiService } from '../services/supabaseApi';
import { useNotifications } from '../components/Notifications/NotificationService';

interface CartContextType {
  items: CartItem[];
  addToCart: (plot: Plot) => void;
  removeFromCart: (plotId: string) => void;
  clearCart: () => void;
  isInCart: (plotId: string) => boolean;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { addNotification } = useNotifications();

  const addToCart = async (plot: Plot) => {
    if (!isInCart(plot.id)) {
      try {
        // Lock the plot on the server
        await supabaseApiService.lockPlot(plot.id);
        
      setItems(prev => [...prev, { plot, addedAt: new Date() }]);
        
        addNotification({
          type: 'success',
          title: 'Plot Added to Cart',
          message: `${plot.title} has been added to your cart. You have 15 minutes to complete the purchase.`
        });
      } catch (error) {
        console.error('Error locking plot:', error);
        addNotification({
          type: 'error',
          title: 'Unable to Add Plot',
          message: 'This plot may have been purchased by another user.'
        });
      }
    }
  };

  const removeFromCart = async (plotId: string) => {
    try {
      // Unlock the plot on the server
      await supabaseApiService.unlockPlot(plotId);
      
      addNotification({
        type: 'info',
        title: 'Plot Removed',
        message: 'Plot has been removed from your cart and is now available to other users.'
      });
    } catch (error) {
      console.error('Error unlocking plot:', error);
    }
    
    setItems(prev => prev.filter(item => item.plot.id !== plotId));
  };

  const clearCart = async () => {
    // Unlock all plots in cart
    for (const item of items) {
      try {
        await supabaseApiService.unlockPlot(item.plot.id);
      } catch (error) {
        console.error('Error unlocking plot:', error);
      }
    }
    
    setItems([]);
    
    addNotification({
      type: 'info',
      title: 'Cart Cleared',
      message: 'All plots have been removed from your cart.'
    });
  };

  const isInCart = (plotId: string) => {
    return items.some(item => item.plot.id === plotId);
  };

  const totalItems = items.length;
  const totalPrice = items.reduce((sum, item) => sum + item.plot.price, 0);

  const value: CartContextType = {
    items,
    addToCart,
    removeFromCart,
    clearCart,
    isInCart,
    totalItems,
    totalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};