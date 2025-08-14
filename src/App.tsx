import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './components/Notifications/NotificationService';
import { useCartTimer } from './hooks/useCartTimer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Cart } from './pages/Cart';
import { AdminPanel } from './pages/AdminPanel';
import { MapView } from './pages/MapView';

const AppContent: React.FC = () => {
  useCartTimer(); // Initialize cart timer
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/map" element={<MapView />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
};

function App() {
  return (
    <NotificationProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <AppContent />
            </Router>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </NotificationProvider>
  );
}

export default App;