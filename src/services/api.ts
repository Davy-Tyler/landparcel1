// Simple API utility for FastAPI backend communication
import { Plot, User, Order, Location } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Simple fetch wrapper with auth headers
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
};

// Simplified API service that directly calls FastAPI endpoints
export const apiService = {
  // Auth endpoints
  async login(email: string, password: string) {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
      if (response.status === 401) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      throw new Error(errorData.detail || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    
    // Get user data after login
    const user = await this.getCurrentUser();
    return {
      user,
      session: { access_token: data.access_token }
    };
  },

  async register(userData: any) {
    const user = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Auto-login after successful registration
    try {
      const loginData = await this.login(userData.email, userData.password);
      return {
        user: loginData.user,
        session: loginData.session
      };
    } catch (loginError) {
      return { user, session: null };
    }
  },

  async getCurrentUser(): Promise<User> {
    return apiRequest('/users/me');
  },

  // Plot endpoints
  async getPlots(params?: any): Promise<Plot[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
          searchParams.append(key, params[key].toString());
        }
      });
    }
    return apiRequest(`/plots?${searchParams}`);
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
  }
};