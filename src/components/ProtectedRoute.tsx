import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { getHomeRoute } from '../lib/getHomeRoute';
import { hasAnyGymRole } from '../lib/permissions';

export function ProtectedRoute({
  children,
  requireGymRole = false,
  requirePlatformAdmin = false,
}: {
  children: ReactNode;
  requireGymRole?: boolean;
  requirePlatformAdmin?: boolean;
}) {
  const { session, profile, gymMemberships, loading } = useAuth();

  if (loading) return <p className="text-gray-400">Loading…</p>;
  if (!session) return <Navigate to="/login" replace />;
  if (requireGymRole && !hasAnyGymRole(gymMemberships) && !profile?.is_platform_admin) {
    return <Navigate to={getHomeRoute(gymMemberships)} replace />;
  }
  if (requirePlatformAdmin && !profile?.is_platform_admin) return <Navigate to={getHomeRoute(gymMemberships)} replace />;

  return <>{children}</>;
}
