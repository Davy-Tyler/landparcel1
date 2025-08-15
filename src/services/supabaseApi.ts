import { supabase } from '../lib/supabase';
import { Plot, User, Order, Location } from '../types';

// Placeholder for password field in custom users table (supabase manages auth separately)
const HASH_PLACEHOLDER = 'supabase-auth';

class SupabaseApiService {
  // Auth methods
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Provide more specific error messages
      if (error.message === 'Email not confirmed') {
        throw new Error('Please check your email and click the confirmation link before signing in.');
      } else if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      throw error;
    }
    return data;
  }

  async register(userData: any) {
    // Sign up the user without email confirmation for development
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone_number: userData.phone_number,
        },
        // Skip email confirmation in development
        emailRedirectTo: undefined,
      },
    });

    if (error) {
      console.error('Supabase registration error:', error);
      throw error;
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      console.log('User created but email not confirmed, attempting manual confirmation...');
      
      // For development, we'll try to confirm the user automatically
      // This is a workaround since we can't disable email confirmation from the client
      try {
        // Attempt to sign in immediately (this will work if email confirmation is disabled in Supabase settings)
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password,
        });
        
        if (!signInError && signInData.session) {
          console.log('Successfully signed in after registration');
          data.session = signInData.session;
        } else if (signInError?.message === 'Email not confirmed') {
          // Email confirmation is required - inform the user
          throw new Error('Please check your email and click the confirmation link before signing in.');
        } else {
          throw signInError || new Error('Failed to sign in after registration');
        }
      } catch (signInErr) {
        console.error('Auto sign-in failed:', signInErr);
        throw signInErr;
      }
    }

    // Create user record in users table if we have a confirmed user
    if (data.user && data.session) {
      try {
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone_number: userData.phone_number,
            role: 'user',
            is_active: true,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });
        
        if (upsertError) {
          console.error('Error creating/updating user record:', upsertError);
        }
      } catch (err) {
        console.error('Error upserting user:', err);
      }
    }

    return data;
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Try to get user data from our users table by id (primary key)
    let { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user data:', error);
    }

    // If user doesn't exist in users table, create them
    if (!userData) {
      try {
        const insertPayload = {
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          phone_number: user.user_metadata?.phone_number || '',
          hashed_password: HASH_PLACEHOLDER,
          role: 'user' as const,
          is_active: true,
        };

        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .upsert(insertPayload, { onConflict: 'id' })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user record:', insertError);
          // Return fallback user object from auth data
          return {
            id: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            phone_number: user.user_metadata?.phone_number || '',
            role: 'user',
            is_active: true,
            created_at: user.created_at
          };
        }
        userData = newUser;
      } catch (createError) {
        console.error('Error creating user record:', createError);
        // Return fallback user object from auth data
        return {
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          phone_number: user.user_metadata?.phone_number || '',
          role: 'user',
          is_active: true,
          created_at: user.created_at
        };
      }
    }

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