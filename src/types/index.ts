export interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone_number?: string;
  role: 'master_admin' | 'admin' | 'partner' | 'user';
  is_active: boolean;
  created_at: string;
}

export interface Location {
  id: string;
  name: string;
  hierarchy: LocationHierarchy;
  created_at: string;
}

export interface LocationHierarchy {
  region: string;
  districts: {
    [districtName: string]: {
      councils: string[];
    };
  };
}

export interface Plot {
  id: string;
  plot_number?: string;
  title: string;
  description?: string;
  area_sqm: number;
  price: number;
  image_urls?: string[];
  usage_type?: string;
  status: 'available' | 'locked' | 'pending_payment' | 'sold';
  location_id?: string;
  geom?: any;
  uploaded_by_id?: string;
  created_at: string;
  location?: Location;
  locked_until?: string;
}

export interface Order {
  id: string;
  user_id: string;
  plot_id: string;
  order_status: string;
  created_at: string;
  user?: User;
  plot?: Plot;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

export interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  password: string;
}

export interface CartItem {
  plot: Plot;
  addedAt: Date;
}

export interface Language {
  code: 'en' | 'sw';
  name: string;
  nativeName: string;
}