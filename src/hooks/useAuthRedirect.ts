import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useAuthRedirect = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we're not loading and user is authenticated
    if (!loading && user) {
      console.log('User authenticated, redirecting to home...');
      navigate('/home', { replace: true });
    }
  }, [user, loading, navigate]);

  return { user, loading };
};
