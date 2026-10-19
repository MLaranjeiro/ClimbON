import type { Session, User } from '@supabase/supabase-js';
import { createContext } from 'react';
import type { GymMembership, UserProfile } from '../../types';

export interface HomeGymSummary {
  id: number;
  gym_name: string;
  slug: string;
}

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  gymMemberships: GymMembership[];
  homeGym: HomeGymSummary | null;
  loading: boolean;
  // True while a signed-in user's profile and gym roles are still being fetched.
  profileLoading: boolean;
  // True while the session came from a password-reset link and the new password
  // hasn't been set yet — such a session may only use /reset-password.
  passwordRecovery: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setHomeGym: (gymId: number | null) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
