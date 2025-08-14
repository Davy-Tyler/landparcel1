import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseApiService } from '../services/supabaseApi';
import { supabase } from '../lib/supabase';
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

    // Check if user is already logged in
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

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session) {
        try {
          setLoading(true);
          const userData = await supabaseApiService.getCurrentUser();
          if (mounted && userData) {
            console.log('Setting user data:', userData.email);
            setUser(userData);
          }
        } catch (error) {
          console.error('Error getting user data after sign in:', error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await supabaseApiService.login(email, password);
      
      if (result.session) {
        console.log('Login successful, waiting for auth state change...');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      // Re-throw the error so the UI can display the specific message
      throw error;
    } finally {
      setTimeout(() => setLoading(false), 1000);
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

      const result = await supabaseApiService.register(userData);
      
      if (result.user) {
        console.log('Registration successful for:', result.user.email);
        
        if (result.session) {
          console.log('User has session, waiting for auth state change...');
          return true;
        } else {
          // User created but needs email confirmation
          throw new Error('Registration successful! Please check your email and click the confirmation link to complete your account setup.');
        }
      }
      
      return false;
    } catch (error: any) {
      console.error('Registration error:', error);
      // Re-throw the error so the UI can display the specific message
      throw error;
    } finally {
      setTimeout(() => setLoading(false), 1000);
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