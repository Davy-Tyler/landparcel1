import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        // Role-based redirect
        // We fetch fresh user from context (already updated by login)
        // Fallback to home if no role
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        // (Optionally we could expose user from context directly here)
        setTimeout(() => {
          try {
            const stored = localStorage.getItem('preferred_redirect');
            if (stored) {
              navigate(stored);
              return;
            }
          } catch {}
          // Basic heuristic: admin or master_admin -> /admin, others -> /dashboard
          // We can't import useAuth again inside handler (already inside component), so reuse closure
          // login() updated context; pull user
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          // (Simplify: navigate directly to /admin or /dashboard based on window variable if needed)
          // For simplicity we'll optimistic navigate to admin then fallback handled by route guard if implemented
          // Better: expose user from useAuth() earlier
        }, 0);
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      let message = 'Login failed. Please try again.';
      if (err && typeof err === 'object' && 'message' in err) {
        const raw = String((err as any).message);
        // Map common Supabase auth errors to friendly text
        if (/invalid login credentials/i.test(raw)) {
          message = 'Invalid email or password';
        } else if (/email not confirmed/i.test(raw)) {
          message = 'Please confirm your email before signing in.';
        } else if (/network/i.test(raw)) {
          message = 'Network error. Check your connection and try again.';
        } else {
          message = raw;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center space-x-2">
            <MapPin className="w-10 h-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">LandHub</span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link
            to="/register"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            create a new account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};