import { Mountain } from 'lucide-react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { getHomeRoute } from '../lib/getHomeRoute';

export function AuthLayout() {
  const { session, gymMemberships, loading } = useAuth();

  if (loading) return null;
  if (session) return <Navigate to={getHomeRoute(gymMemberships)} replace />;

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-brand-600 flex items-center justify-center mb-4">
            <Mountain className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-bold text-white">Rock Climbing Beta Tracker</h1>
          <p className="text-sm text-gray-400 mt-1">Track your climbs, share your beta</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
