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
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setHomeGym: (gymId: number | null) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
