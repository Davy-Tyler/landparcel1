import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../Notifications/NotificationService';

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (message: any) => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const subscriptionsRef = useRef<Set<string>>(new Set());

  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/api/ws';

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Clear any reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Resubscribe to channels
        subscriptionsRef.current.forEach(channel => {
          sendMessage({ type: 'subscribe', channel });
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  };

  const subscribe = (channel: string) => {
    subscriptionsRef.current.add(channel);
    if (isConnected) {
      sendMessage({ type: 'subscribe', channel });
    }
  };

  const unsubscribe = (channel: string) => {
    subscriptionsRef.current.delete(channel);
    if (isConnected) {
      sendMessage({ type: 'unsubscribe', channel });
    }
  };

  const handleMessage = (data: any) => {
    switch (data.type) {
      case 'plot_update':
        // Handle plot updates
        if (data.data) {
          addNotification({
            type: 'info',
            title: 'Plot Updated',
            message: `Plot "${data.data.title}" has been updated`,
            duration: 3000
          });
        }
        break;

      case 'notification':
        // Handle user notifications
        if (data.data) {
          addNotification({
            type: data.data.type || 'info',
            title: data.data.title || 'Notification',
            message: data.data.message || '',
            duration: data.data.duration
          });
        }
        break;

      case 'pong':
        // Handle ping/pong for connection health
        break;

      default:
        console.log('Unhandled WebSocket message:', data);
    }
  };

  // Send periodic ping to keep connection alive
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (isConnected) {
        sendMessage({ type: 'ping' });
      }
    }, 30000); // 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  // Connect when user is authenticated
  useEffect(() => {
    // Always try to connect for real-time updates
    // WebSocket can work without authentication for public data
    connect();

    return () => {
      disconnect();
    };
  }, []); // Remove user dependency to allow public connections

  const value: WebSocketContextType = {
    isConnected,
    sendMessage,
    subscribe,
    unsubscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};