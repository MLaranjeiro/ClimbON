import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { getHomeRoute } from '../lib/getHomeRoute';
import type { UserRole } from '../types';

export function ProtectedRoute({ children, role }: { children: ReactNode; role?: UserRole }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <p className="text-gray-400">Loading…</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (role && profile?.role !== role) return <Navigate to={getHomeRoute(profile?.role)} replace />;

  return <>{children}</>;
}
