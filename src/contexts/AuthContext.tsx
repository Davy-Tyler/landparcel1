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

    // Check if user is already logged in by checking for token and validating it
    const checkUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const userData = await apiService.getCurrentUser();
          if (mounted && userData) {
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Error checking user session:', error);
        // Invalid token, remove it
        localStorage.removeItem('access_token');
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
      const result = await apiService.login(email, password);
      
      if (result.session && result.user) {
        console.log('Login successful for:', result.user.email);
        setUser(result.user);
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

      const result = await apiService.register(userData);
      
      if (result.user) {
        console.log('Registration successful for:', result.user.email);
        
        if (result.session) {
          console.log('User has session after registration');
          setUser(result.user);
          return true;
        } else {
          // User created but auto-login failed
          console.log('Registration successful, but auto-login failed');
          return false;
        }
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