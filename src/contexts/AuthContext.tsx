import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { User, AuthContextType, RegisterData } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkUser = async () => {
      try {
        // Check for backend token first
        const token = localStorage.getItem('access_token');
        if (token) {
          const userData = await apiService.getCurrentUser();
          if (mounted && userData) {
            setUser(userData);
            setLoading(false);
            return;
          }
        }

        // Check for Supabase session
        const supabaseSession = localStorage.getItem('supabase_session');
        if (supabaseSession) {
          const userData = await apiService.getCurrentUser();
          if (mounted && userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Error checking user session:', error);
        // Clear invalid tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('supabase_session');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkUser();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('Attempting login for:', email);
      console.log('API URL:', import.meta.env.VITE_API_URL);
      
      const loginResult = await apiService.login(email, password);
      const userData = loginResult.user;
      if (userData) {
        console.log('Login successful for:', userData.email);
        setUser(userData);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error details:', error);
      
      // If backend is not available, show clear message
      if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        throw new Error('Backend server is not running. Please install backend dependencies and start the server.');
      }
      
      // Enhanced error handling
      let message = 'Login failed. Please try again.';
      if (!navigator.onLine) {
        message = 'You appear to be offline. Please check your internet connection.';
      } else if (error?.response?.status === 401) {
        message = 'Invalid email or password.';
      } else if (error?.response?.status === 400) {
        message = 'Please check your email and password.';
      } else if (error?.response?.status === 500) {
        message = 'Server error. Please try again later.';
      } else if (error?.message) {
        message = error.message;
      }
      
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Basic client-side email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('Please enter a valid email address.');
      }
      if (userData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      console.log('Attempting registration for:', userData.email);

      const registerResult = await apiService.register(userData);
      const user = registerResult.user;
      
      if (user) {
        console.log('Registration successful for:', user.email);
        setUser(user);
        return true;
      }
      return false;
      
    } catch (error: any) {
      console.error('Registration error details:', error);
      
      // If backend is not available, show clear message
      if (error?.name === 'TypeError' && error?.message?.includes('fetch')) {
        throw new Error('Backend server is not running. Please install dependencies: pip install fastapi uvicorn supabase');
      }
      
      let message = 'Registration failed. Please try again.';
      if (!navigator.onLine) {
        message = 'You appear to be offline. Please check your internet connection.';
      } else if (error?.response?.status === 409) {
        message = 'An account with this email already exists.';
      } else if (error?.response?.status === 400) {
        message = 'Please check your information and try again.';
      } else if (error?.response?.status === 500) {
        message = 'Server error. Please try again later.';
      } else if (error?.message) {
        message = error.message;
      }
      
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};