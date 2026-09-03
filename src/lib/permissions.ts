import type { GymMembership } from '../types';

type MembershipLike = Pick<GymMembership, 'gym_id' | 'role'>;

export function isGymAdmin(memberships: MembershipLike[], gymId: number | null): boolean {
  return memberships.some((m) => m.gym_id === gymId && m.role === 'gym_admin');
}

export function hasAnyGymRole(memberships: MembershipLike[]): boolean {
  return memberships.length > 0;
}
