import { Plot, User, Order } from '../types';

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
      throw new Error('Login failed');
    }

    const data = await response.json();
    localStorage.setItem('access_token', data.access_token);
    return data;
  }

  async register(userData: any) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return response.json();
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
      throw new Error('Failed to update user role');
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
  async getRegions() {
    const response = await fetch(`${API_BASE_URL}/plots/locations/regions`);
    if (!response.ok) throw new Error('Failed to fetch regions');
    return response.json();
  }

  async getDistricts(regionId?: number) {
    const params = regionId ? `?region_id=${regionId}` : '';
    const response = await fetch(`${API_BASE_URL}/plots/locations/districts${params}`);
    if (!response.ok) throw new Error('Failed to fetch districts');
    return response.json();
  }

  async getCouncils(districtId?: number) {
    const params = districtId ? `?district_id=${districtId}` : '';
    const response = await fetch(`${API_BASE_URL}/plots/locations/councils${params}`);
    if (!response.ok) throw new Error('Failed to fetch councils');
    return response.json();
  }

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