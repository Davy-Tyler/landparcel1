import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseApiService } from '../services/supabaseApi';
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

    // Check if user is already logged in by checking for token and validating it
    const checkUser = async () => {
      try {
        const userData = await supabaseApiService.getCurrentUser();
        if (mounted && userData) {
          setUser(userData);
        }
      } catch (error) {
        console.error('Error checking user session:', error);
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
      await supabaseApiService.login(email, password);
      const userData = await supabaseApiService.getCurrentUser();
      if (userData) {
        console.log('Login successful for:', userData.email);
        setUser(userData);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      // Re-throw the error so the UI can display the specific message
      throw error;
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

      await supabaseApiService.register(userData);
      // Fetch / create profile row
      const user = await supabaseApiService.getCurrentUser();
      
      if (user) {
        console.log('Registration successful for:', user.email);
        setUser(user);
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Registration error:', error);
      // Re-throw the error so the UI can display the specific message
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabaseApiService.logout();
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