import type { UserRole } from '../types';

export function getHomeRoute(role?: UserRole | null): string {
  if (role === 'route_setter') return '/admin';
  return '/';
}
