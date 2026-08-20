import type { Session, User } from '@supabase/supabase-js';
import { createContext } from 'react';
import type { GymMembership, UserProfile } from '../../types';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  gymMemberships: GymMembership[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
