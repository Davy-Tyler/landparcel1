import { Plot, User, Order, Location } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiService {
  private getAuthHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

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
    // Return data in the format expected by existing code
    return {
      user: await this.getCurrentUser(),
      session: { access_token: data.access_token }
    };
  }

  async register(userData: any) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Registration failed' }));
      if (response.status === 400 && errorData.detail?.includes('Email already registered')) {
        throw new Error('Email already registered');
      }
      throw new Error(errorData.detail || 'Registration failed');
    }

    const user = await response.json();
    // Auto-login after successful registration
    try {
      const loginData = await this.login(userData.email, userData.password);
      return {
        user: loginData.user,
        session: loginData.session
      };
    } catch (loginError) {
      // If auto-login fails, return the created user
      return {
        user,
        session: null
      };
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to get user');
    }

    return response.json();
  }

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

    const response = await fetch(`${API_BASE_URL}/plots?${searchParams}`);

    if (!response.ok) {
      throw new Error('Failed to fetch plots');
    }

    return response.json();
  }

  async getPlot(id: string): Promise<Plot> {
    const response = await fetch(`${API_BASE_URL}/plots/${id}`);

    if (!response.ok) {
      throw new Error('Failed to fetch plot');
    }

    return response.json();
  }

  async createPlot(plotData: any): Promise<Plot> {
    const response = await fetch(`${API_BASE_URL}/plots`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(plotData),
    });

    if (!response.ok) {
      throw new Error('Failed to create plot');
    }

    return response.json();
  }

  async updatePlot(id: string, plotData: any): Promise<Plot> {
    const response = await fetch(`${API_BASE_URL}/plots/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(plotData),
    });

    if (!response.ok) {
      throw new Error('Failed to update plot');
    }

    return response.json();
  }

  // Order endpoints
  async getOrders(): Promise<Order[]> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch orders');
    }

    return response.json();
  }

  async createOrder(plotId: string): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ plot_id: plotId }),
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
    }

    return response.json();
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ order_status: status }),
    });

    if (!response.ok) {
      throw new Error('Failed to update order status');
    }

    return response.json();
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ role }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to update user role' }));
      throw new Error(errorData.detail || 'Failed to update user role');
    }

    return response.json();
  }

  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  }

  // Location endpoints
  async getLocations(): Promise<Location[]> {
    const response = await fetch(`${API_BASE_URL}/plots/locations`);
    if (!response.ok) throw new Error('Failed to fetch locations');
    return response.json();
  }

  async getRegions() {
    const response = await fetch(`${API_BASE_URL}/plots/locations/regions`);
    if (!response.ok) throw new Error('Failed to fetch regions');
    return response.json();
  }

  async getDistricts(region?: string) {
    const params = region ? `?region=${encodeURIComponent(region)}` : '';
    const response = await fetch(`${API_BASE_URL}/plots/locations/districts${params}`);
    if (!response.ok) throw new Error('Failed to fetch districts');
    return response.json();
  }

  async getCouncils(region?: string, district?: string) {
    const params = new URLSearchParams();
    if (region) params.append('region', region);
    if (district) params.append('district', district);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/plots/locations/councils${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch councils');
    return response.json();
  }

  // Plot locking endpoints
  async lockPlot(plotId: string): Promise<Plot> {
    const response = await fetch(`${API_BASE_URL}/plots/${plotId}/lock`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to lock plot');
    }

    return response.json();
  }

  async unlockPlot(plotId: string): Promise<Plot> {
    const response = await fetch(`${API_BASE_URL}/plots/${plotId}/unlock`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to unlock plot');
    }

    return response.json();
  }


  logout() {
    localStorage.removeItem('access_token');
  }
}

export const apiService = new ApiService();