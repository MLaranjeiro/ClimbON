import type { GymMembership } from '../types';
import { hasAnyGymRole } from './permissions';

export function getHomeRoute(memberships?: Pick<GymMembership, 'gym_id' | 'role'>[] | null): string {
  if (memberships && hasAnyGymRole(memberships)) return '/admin';
  return '/';
}
