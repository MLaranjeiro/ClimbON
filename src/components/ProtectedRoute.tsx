import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { getHomeRoute } from '../lib/getHomeRoute';
import { hasAnyGymRole } from '../lib/permissions';

export function ProtectedRoute({ children, requireGymRole = false }: { children: ReactNode; requireGymRole?: boolean }) {
  const { session, gymMemberships, loading } = useAuth();

  if (loading) return <p className="text-gray-400">Loading…</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (requireGymRole && !hasAnyGymRole(gymMemberships)) return <Navigate to={getHomeRoute(gymMemberships)} replace />;

  return <>{children}</>;
}
