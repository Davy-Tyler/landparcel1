import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  console.log('Available env vars:', Object.keys(import.meta.env));
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Please check your .env file.');
}

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  console.log('Available env vars:', Object.keys(import.meta.env));
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          email: string;
          phone_number: string | null;
          hashed_password: string;
          role: 'master_admin' | 'admin' | 'partner' | 'user';
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          email: string;
          phone_number?: string | null;
          hashed_password: string;
          role?: 'master_admin' | 'admin' | 'partner' | 'user';
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          email?: string;
          phone_number?: string | null;
          hashed_password?: string;
          role?: 'master_admin' | 'admin' | 'partner' | 'user';
          is_active?: boolean;
          created_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          name: string;
          hierarchy: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          hierarchy: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          hierarchy?: any;
          created_at?: string;
        };
      };
      plots: {
        Row: {
          id: string;
          plot_number: string | null;
          title: string;
          description: string | null;
          area_sqm: number;
          price: number;
          image_urls: string[] | null;
          usage_type: string | null;
          status: 'available' | 'locked' | 'pending_payment' | 'sold';
          location_id: string | null;
          geom: any;
          uploaded_by_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          plot_number?: string | null;
          title: string;
          description?: string | null;
          area_sqm: number;
          price: number;
          image_urls?: string[] | null;
          usage_type?: string | null;
          status?: 'available' | 'locked' | 'pending_payment' | 'sold';
          location_id?: string | null;
          geom?: any;
          uploaded_by_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          plot_number?: string | null;
          title?: string;
          description?: string | null;
          area_sqm?: number;
          price?: number;
          image_urls?: string[] | null;
          usage_type?: string | null;
          status?: 'available' | 'locked' | 'pending_payment' | 'sold';
          location_id?: string | null;
          geom?: any;
          uploaded_by_id?: string | null;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          plot_id: string;
          order_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plot_id: string;
          order_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plot_id?: string;
          order_status?: string;
          created_at?: string;
        };
      };
    };
  };
};