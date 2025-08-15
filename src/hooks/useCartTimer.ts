import { useEffect, useCallback } from 'react';
import { useCart } from '../contexts/CartContext';
import { apiService } from '../services/api';

export const useCartTimer = () => {
  const { items, removeFromCart } = useCart();

  const checkExpiredItems = useCallback(async () => {
    const now = new Date();
    
    for (const item of items) {
      // Check if item has been in cart for more than 15 minutes
      const timeInCart = now.getTime() - item.addedAt.getTime();
      const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
      
      if (timeInCart > fifteenMinutes) {
        try {
          // Unlock the plot on the server
          await apiService.unlockPlot(item.plot.id);
          // Remove from cart
          removeFromCart(item.plot.id);
        } catch (error) {
          console.error('Error unlocking expired plot:', error);
        }
      }
    }
  }, [items, removeFromCart]);

  useEffect(() => {
    // Check for expired items every minute
    const interval = setInterval(checkExpiredItems, 60000);
    
    return () => clearInterval(interval);
  }, [checkExpiredItems]);

  return { checkExpiredItems };
};