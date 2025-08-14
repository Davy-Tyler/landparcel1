import { supabase } from '../lib/supabase';
import { Plot, User, Order, Location } from '../types';

class SupabaseApiService {
  // Auth methods
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async register(userData: any) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone_number: userData.phone_number,
        },
      },
    });

    if (error) throw error;
    return data;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (error) throw error;
    return userData;
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Plot methods
  async getPlots(params?: any): Promise<Plot[]> {
    let query = supabase
      .from('plots')
      .select(`
        *,
        location:locations(*)
      `);

    if (params) {
      if (params.status) query = query.eq('status', params.status);
      if (params.search) {
        query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }
      if (params.min_price) query = query.gte('price', params.min_price);
      if (params.max_price) query = query.lte('price', params.max_price);
      if (params.min_area) query = query.gte('area_sqm', params.min_area);
      if (params.max_area) query = query.lte('area_sqm', params.max_area);
      if (params.location_id) query = query.eq('location_id', params.location_id);
      if (params.usage_type) query = query.eq('usage_type', params.usage_type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getPlot(id: string): Promise<Plot> {
    const { data, error } = await supabase
      .from('plots')
      .select(`
        *,
        location:locations(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createPlot(plotData: any): Promise<Plot> {
    const { data, error } = await supabase
      .from('plots')
      .insert(plotData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updatePlot(id: string, plotData: any): Promise<Plot> {
    const { data, error } = await supabase
      .from('plots')
      .update(plotData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');

    const currentUser = await this.getCurrentUser();
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        user:users(*),
        plot:plots(*, location:locations(*))
      `);

    // If not admin, only show user's own orders
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'master_admin') {
      query = query.eq('user_id', currentUser?.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createOrder(plotId: string): Promise<Order> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');

    const currentUser = await this.getCurrentUser();
    
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: currentUser?.id,
        plot_id: plotId,
        order_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({ order_status: status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Location methods
  async getLocations(): Promise<Location[]> {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // User management methods
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Plot locking methods (for cart functionality)
  async lockPlot(plotId: string): Promise<Plot> {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + 15); // Lock for 15 minutes

    const { data, error } = await supabase
      .from('plots')
      .update({ 
        status: 'locked',
        locked_until: lockUntil.toISOString()
      })
      .eq('id', plotId)
      .eq('status', 'available') // Only lock if currently available
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async unlockPlot(plotId: string): Promise<Plot> {
    const { data, error } = await supabase
      .from('plots')
      .update({ 
        status: 'available',
        locked_until: null
      })
      .eq('id', plotId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const supabaseApiService = new SupabaseApiService();