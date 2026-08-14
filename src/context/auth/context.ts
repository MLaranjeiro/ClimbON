import type { Session, User } from '@supabase/supabase-js';
import { createContext } from 'react';
import type { UserProfile } from '../../types';

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
