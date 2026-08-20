import type { Session } from '@supabase/supabase-js';
import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import type { GymMembership, UserProfile } from '../../types';
import { AuthContext } from './context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [gymMemberships, setGymMemberships] = useState<GymMembership[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId: string) {
    const [{ data: profileData }, { data: membershipData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('gym_memberships').select('*, gym:gyms(*)').eq('user_id', userId),
    ]);
    setProfile(profileData as UserProfile | null);
    setGymMemberships((membershipData as GymMembership[] | null) ?? []);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) {
        loadProfile(data.session.user.id);
      } else {
        setProfile(null);
        setGymMemberships([]);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setGymMemberships([]);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function refreshProfile() {
    if (session?.user) {
      await loadProfile(session.user.id);
    }
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, profile, gymMemberships, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
