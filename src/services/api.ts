// Simple API utility for FastAPI backend communication
import { Plot, User, Order, Location } from '../types';
import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const USE_DIRECT_SUPABASE = import.meta.env.VITE_USE_DIRECT_SUPABASE_AUTH === 'true';

// Initialize Supabase client for fallback
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Enhanced error handling
class ApiError extends Error {
  constructor(public status: number, message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

// Simple fetch wrapper with auth headers
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new ApiError(response.status, errorData.detail || `Request failed with status ${response.status}`, errorData);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or other errors
    throw new ApiError(0, `Network error: ${error.message}`, error);
  }
};

// Simplified API service that directly calls FastAPI endpoints
export const apiService = {
  // Auth endpoints
  async login(email: string, password: string) {
    // Try backend first, fallback to Supabase
    try {
      if (!USE_DIRECT_SUPABASE) {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Backend login failed');
        }

        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        
        const user = await this.getCurrentUser();
        return {
          user,
          session: { access_token: data.access_token }
        };
      }
    } catch (error) {
      console.log('Backend login failed, trying Supabase:', error);
    }

    // Fallback to Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      throw new Error(error.message);
    }

    if (data.user) {
      // Store Supabase session
      localStorage.setItem('supabase_session', JSON.stringify(data.session));
      
      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        first_name: data.user.user_metadata?.first_name || '',
        last_name: data.user.user_metadata?.last_name || '',
        phone_number: data.user.user_metadata?.phone_number || '',
        role: data.user.user_metadata?.role || 'user',
        is_active: true,
        created_at: data.user.created_at!
      };

      return { user, session: data.session };
    }

    throw new Error('Login failed');
  },

  async register(userData: any) {
    // Try backend first, fallback to Supabase
    try {
      if (!USE_DIRECT_SUPABASE) {
        const user = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData),
        });

        // Auto-login after successful registration
        const loginData = await this.login(userData.email, userData.password);
        return {
          user: loginData.user,
          session: loginData.session
        };
      }
    } catch (error) {
      console.log('Backend registration failed, trying Supabase:', error);
    }

    // Fallback to Supabase
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone_number: userData.phone_number,
          role: 'user'
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('An account with this email already exists.');
      }
      throw new Error(error.message);
    }

    if (data.user) {
      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        role: 'user',
        is_active: true,
        created_at: data.user.created_at!
      };

      // Store session if confirmed
      if (data.session) {
        localStorage.setItem('supabase_session', JSON.stringify(data.session));
      }

      return { user, session: data.session };
    }

    throw new Error('Registration failed');
  },

  async getCurrentUser(): Promise<User> {
    // Try backend first
    try {
      if (!USE_DIRECT_SUPABASE) {
        return await apiRequest('/users/me');
      }
    } catch (error) {
      console.log('Backend getCurrentUser failed, trying Supabase:', error);
    }

    // Fallback to Supabase
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      return {
        id: user.id,
        email: user.email!,
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
        phone_number: user.user_metadata?.phone_number || '',
        role: user.user_metadata?.role || 'user',
        is_active: true,
        created_at: user.created_at!
      };
    }

    throw new Error('No user found');
  },

  // Plot endpoints
  async getPlots(params?: any): Promise<Plot[]> {
    try {
      const searchParams = new URLSearchParams();
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
            searchParams.append(key, params[key].toString());
          }
        });
      }
      return await apiRequest(`/plots?${searchParams}`);
    } catch (error) {
      // Fallback to sample data if backend is not available
      console.log('Backend not available, using sample data');
      const { samplePlots } = await import('../data/samplePlots');
      return samplePlots;
    }
  },

  async getPlot(id: string): Promise<Plot> {
    return apiRequest(`/plots/${id}`);
  },

  async createPlot(plotData: any): Promise<Plot> {
    return apiRequest('/plots', {
      method: 'POST',
      body: JSON.stringify(plotData),
    });
  },

  async updatePlot(id: string, plotData: any): Promise<Plot> {
    return apiRequest(`/plots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(plotData),
    });
  },

  async getPlotsByRegion(region: string): Promise<Plot[]> {
    try {
      return await apiRequest(`/plots?region=${encodeURIComponent(region)}`);
    } catch (error) {
      console.log('Backend not available, filtering sample data');
      const { samplePlots } = await import('../data/samplePlots');
      return samplePlots.filter(plot => 
        plot.location.region.toLowerCase() === region.toLowerCase()
      );
    }
  },

  async createPlotBatch(plots: Partial<Plot>[]): Promise<Plot[]> {
    return apiRequest('/plots/batch', {
      method: 'POST',
      body: JSON.stringify({ plots }),
    });
  },

  async uploadPlotImages(plotId: string, formData: FormData): Promise<{ urls: string[] }> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/plots/${plotId}/images`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    return response.json();
  },

  // Order endpoints
  async getOrders(): Promise<Order[]> {
    return apiRequest('/orders');
  },

  async createOrder(plotId: string): Promise<Order> {
    return apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({ plot_id: plotId }),
    });
  },

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    return apiRequest(`/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ order_status: status }),
    });
  },

  async updateUserRole(userId: string, role: string): Promise<User> {
    return apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  async getUsers(): Promise<User[]> {
    return apiRequest('/users');
  },

  // Location endpoints
  async getLocations(): Promise<Location[]> {
    return apiRequest('/plots/locations');
  },

  async getRegions() {
    return apiRequest('/plots/locations/regions');
  },

  async getDistricts(region?: string) {
    const params = region ? `?region=${encodeURIComponent(region)}` : '';
    return apiRequest(`/plots/locations/districts${params}`);
  },

  async getCouncils(region?: string, district?: string) {
    const params = new URLSearchParams();
    if (region) params.append('region', region);
    if (district) params.append('district', district);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiRequest(`/plots/locations/councils${queryString}`);
  },

  // Plot locking endpoints
  async lockPlot(plotId: string): Promise<Plot> {
    return apiRequest(`/plots/${plotId}/lock`, { method: 'POST' });
  },

  async unlockPlot(plotId: string): Promise<Plot> {
    return apiRequest(`/plots/${plotId}/unlock`, { method: 'POST' });
  },

  // Geospatial endpoints
  async uploadShapefile(formData: FormData) {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${API_BASE_URL}/geo/shapefile/upload`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(errorData.detail || 'Shapefile upload failed');
    }

    return response.json();
  },

  async getShapefileStatus(taskId: string) {
    return apiRequest(`/geo/shapefile/status/${taskId}`);
  },

  async getPlotsInArea(polygonCoords: number[][]) {
    return apiRequest('/geo/plots-in-area', {
      method: 'POST',
      body: JSON.stringify(polygonCoords),
    });
  },

  async getPlotsNearPoint(lat: number, lng: number, radiusKm: number = 5) {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius_km: radiusKm.toString(),
    });
    return apiRequest(`/geo/plots-near-point?${params}`);
  },

  async getGeoStatistics(locationId?: string) {
    const params = locationId ? `?location_id=${locationId}` : '';
    return apiRequest(`/geo/statistics${params}`);
  },

  async validateGeometry(geometry: any) {
    return apiRequest('/geo/validate-geometry', {
      method: 'POST',
      body: JSON.stringify(geometry),
    });
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('supabase_session');
    supabase.auth.signOut();
  }
};