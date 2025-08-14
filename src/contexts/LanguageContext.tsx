import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from '../types';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
];

const translations = {
  en: {
    // Navigation
    'nav.browse_plots': 'Browse Plots',
    'nav.map_view': 'Map View',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.dashboard': 'Dashboard',
    'nav.admin_panel': 'Admin Panel',
    'nav.logout': 'Logout',
    'nav.cart': 'Cart',

    // Home page
    'home.title': 'Find Your Perfect Plot in Tanzania',
    'home.subtitle': 'Discover available land plots across Tanzania with our interactive platform',
    'home.found_plots': 'Found {count} plots',

    // Plot details
    'plot.area': 'Area',
    'plot.price': 'Price',
    'plot.location': 'Location',
    'plot.usage_type': 'Usage Type',
    'plot.status': 'Status',
    'plot.listed': 'Listed',
    'plot.description': 'Description',
    'plot.plot_number': 'Plot Number',
    'plot.add_to_cart': 'Add to Cart',
    'plot.view_details': 'View Details',
    'plot.in_cart': 'In Cart',
    'plot.already_in_cart': 'Already in Cart',

    // Search and filters
    'search.title': 'Search & Filter',
    'search.placeholder': 'Search plots by title or description...',
    'search.region': 'Region',
    'search.all_regions': 'All Regions',
    'search.min_price': 'Min Price (TSH)',
    'search.max_price': 'Max Price (TSH)',
    'search.min_area': 'Min Area (sqm)',
    'search.max_area': 'Max Area (sqm)',
    'search.usage_type': 'Usage Type',
    'search.all_types': 'All Types',
    'search.apply_filters': 'Apply Filters',

    // Usage types
    'usage.residential': 'Residential',
    'usage.commercial': 'Commercial',
    'usage.industrial': 'Industrial',
    'usage.agricultural': 'Agricultural',

    // Status
    'status.available': 'Available',
    'status.locked': 'In Cart',
    'status.pending_payment': 'Pending Payment',
    'status.sold': 'Sold',

    // Cart
    'cart.title': 'Your Cart',
    'cart.empty': 'Your cart is empty',
    'cart.empty_subtitle': 'Browse our available plots to find your perfect land.',
    'cart.total': 'Total:',
    'cart.clear_cart': 'Clear Cart',
    'cart.checkout': 'Proceed to Checkout',
    'cart.checkout_note': 'By proceeding, you agree to our terms and conditions. An admin will contact you to complete the purchase.',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Manage your profile and orders',
    'dashboard.profile': 'Profile Information',
    'dashboard.my_orders': 'My Orders',
    'dashboard.no_orders': 'You haven\'t placed any orders yet.',

    // Admin
    'admin.title': 'Admin Panel',
    'admin.subtitle': 'Manage plots, orders, and users',
    'admin.plots': 'Plots',
    'admin.orders': 'Orders',
    'admin.users': 'Users',
    'admin.add_plot': 'Add Plot',
    'admin.plot_management': 'Plot Management',
    'admin.order_management': 'Order Management',
    'admin.user_management': 'User Management',

    // Map
    'map.title': 'Interactive Map View',
    'map.subtitle': 'Explore available plots on the interactive map',
    'map.showing_plots': 'Showing {count} available plots in Tanzania',
    'map.more_plots': '+{count} more plots available',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.name': 'Name',
    'common.email': 'Email',
    'common.phone': 'Phone',
    'common.role': 'Role',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.actions': 'Actions',
  },
  sw: {
    // Navigation
    'nav.browse_plots': 'Tazama Viwanja',
    'nav.map_view': 'Mchoro wa Ramani',
    'nav.login': 'Ingia',
    'nav.register': 'Jisajili',
    'nav.dashboard': 'Dashibodi',
    'nav.admin_panel': 'Paneli ya Msimamizi',
    'nav.logout': 'Toka',
    'nav.cart': 'Kikapu',

    // Home page
    'home.title': 'Pata Kiwanja Chako Kamili Tanzania',
    'home.subtitle': 'Gundua viwanja vya ardhi vinavyopatikana kote Tanzania kwa kutumia jukwaa letu la maingiliano',
    'home.found_plots': 'Viwanja {count} vimepatikana',

    // Plot details
    'plot.area': 'Eneo',
    'plot.price': 'Bei',
    'plot.location': 'Mahali',
    'plot.usage_type': 'Aina ya Matumizi',
    'plot.status': 'Hali',
    'plot.listed': 'Iliorodheshwa',
    'plot.description': 'Maelezo',
    'plot.plot_number': 'Nambari ya Kiwanja',
    'plot.add_to_cart': 'Ongeza Kikupuni',
    'plot.view_details': 'Ona Maelezo',
    'plot.in_cart': 'Kiko Kikupuni',
    'plot.already_in_cart': 'Tayari Kiko Kikupuni',

    // Search and filters
    'search.title': 'Tafuta na Chuja',
    'search.placeholder': 'Tafuta viwanja kwa jina au maelezo...',
    'search.region': 'Mkoa',
    'search.all_regions': 'Mikoa Yote',
    'search.min_price': 'Bei ya Chini (TSH)',
    'search.max_price': 'Bei ya Juu (TSH)',
    'search.min_area': 'Eneo la Chini (sqm)',
    'search.max_area': 'Eneo la Juu (sqm)',
    'search.usage_type': 'Aina ya Matumizi',
    'search.all_types': 'Aina Zote',
    'search.apply_filters': 'Tumia Vichujio',

    // Usage types
    'usage.residential': 'Makazi',
    'usage.commercial': 'Kibiashara',
    'usage.industrial': 'Viwandani',
    'usage.agricultural': 'Kilimo',

    // Status
    'status.available': 'Inapatikana',
    'status.locked': 'Kiko Kikupuni',
    'status.pending_payment': 'Inasubiri Malipo',
    'status.sold': 'Imeuzwa',

    // Cart
    'cart.title': 'Kikapu Chako',
    'cart.empty': 'Kikapu chako ni tupu',
    'cart.empty_subtitle': 'Tazama viwanja vyetu vinavyopatikana kupata ardhi yako kamili.',
    'cart.total': 'Jumla:',
    'cart.clear_cart': 'Safisha Kikapu',
    'cart.checkout': 'Endelea na Ununuzi',
    'cart.checkout_note': 'Kwa kuendelea, unakubali masharti na hali zetu. Msimamizi atakupigia simu kukamilisha ununuzi.',

    // Dashboard
    'dashboard.title': 'Dashibodi',
    'dashboard.subtitle': 'Simamia wasifu wako na maagizo',
    'dashboard.profile': 'Taarifa za Wasifu',
    'dashboard.my_orders': 'Maagizo Yangu',
    'dashboard.no_orders': 'Bado hujaweka agizo lolote.',

    // Admin
    'admin.title': 'Paneli ya Msimamizi',
    'admin.subtitle': 'Simamia viwanja, maagizo, na watumiaji',
    'admin.plots': 'Viwanja',
    'admin.orders': 'Maagizo',
    'admin.users': 'Watumiaji',
    'admin.add_plot': 'Ongeza Kiwanja',
    'admin.plot_management': 'Usimamizi wa Viwanja',
    'admin.order_management': 'Usimamizi wa Maagizo',
    'admin.user_management': 'Usimamizi wa Watumiaji',

    // Map
    'map.title': 'Mchoro wa Ramani ya Maingiliano',
    'map.subtitle': 'Chunguza viwanja vinavyopatikana kwenye ramani ya maingiliano',
    'map.showing_plots': 'Inaonyesha viwanja {count} vinavyopatikana Tanzania',
    'map.more_plots': '+viwanja {count} zaidi vinavyopatikana',

    // Common
    'common.loading': 'Inapakia...',
    'common.error': 'Hitilafu',
    'common.success': 'Mafanikio',
    'common.cancel': 'Ghairi',
    'common.save': 'Hifadhi',
    'common.delete': 'Futa',
    'common.edit': 'Hariri',
    'common.view': 'Ona',
    'common.create': 'Unda',
    'common.update': 'Sasisha',
    'common.name': 'Jina',
    'common.email': 'Barua pepe',
    'common.phone': 'Simu',
    'common.role': 'Jukumu',
    'common.status': 'Hali',
    'common.date': 'Tarehe',
    'common.actions': 'Vitendo',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0]);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('preferred-language', language.code);
  };

  const t = (key: string, params?: Record<string, any>): string => {
    const translation = translations[currentLanguage.code][key] || key;
    
    if (params) {
      return Object.keys(params).reduce((str, param) => {
        return str.replace(`{${param}}`, params[param]);
      }, translation);
    }
    
    return translation;
  };

  // Load saved language preference
  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage) {
      const language = languages.find(lang => lang.code === savedLanguage);
      if (language) {
        setCurrentLanguage(language);
      }
    }
  }, []);

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export { languages };