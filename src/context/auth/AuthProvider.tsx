import type { Session } from '@supabase/supabase-js';
import { useEffect, useState, type ReactNode } from 'react';
import { PASSWORD_RECOVERY_FLAG, supabase } from '../../lib/supabase';
import type { GymMembership, UserProfile } from '../../types';
import { AuthContext, type HomeGymSummary } from './context';

function readRecoveryFlag() {
  try {
    return sessionStorage.getItem(PASSWORD_RECOVERY_FLAG) === '1';
  } catch {
    return false;
  }
}

function writeRecoveryFlag(active: boolean) {
  try {
    if (active) sessionStorage.setItem(PASSWORD_RECOVERY_FLAG, '1');
    else sessionStorage.removeItem(PASSWORD_RECOVERY_FLAG);
  } catch {
    // Storage blocked — the in-memory state still applies for this page load.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [passwordRecovery, setPasswordRecoveryState] = useState(readRecoveryFlag);

  function setPasswordRecovery(active: boolean) {
    writeRecoveryFlag(active);
    setPasswordRecoveryState(active);
  }

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [gymMemberships, setGymMemberships] = useState<GymMembership[]>([]);
  const [homeGym, setHomeGymState] = useState<HomeGymSummary | null>(null);
  const [loading, setLoading] = useState(true);
  // Id of the user whose profile and gym roles have finished loading. The session
  // resolves first, so role checks must wait until this catches up — otherwise a setter
  // opening /admin directly is redirected before their memberships arrive.
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  async function loadProfile(userId: string) {
    const [{ data: profileData }, { data: membershipData }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*, home_gym:gyms!home_gym_id(id, gym_name, slug)')
        .eq('id', userId)
        .single(),
      supabase.from('gym_memberships').select('*, gym:gyms(*)').eq('user_id', userId),
    ]);
    const row = profileData as (UserProfile & { home_gym: HomeGymSummary | null }) | null;
    setProfile(row as UserProfile | null);
    setHomeGymState(row?.home_gym ?? null);
    setGymMemberships((membershipData as GymMembership[] | null) ?? []);
    setLoadedUserId(userId);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
      if (data.session?.user) {
        loadProfile(data.session.user.id);
      } else {
        // An expired or already-used reset link leaves the flag behind with no session.
        setPasswordRecovery(false);
        setProfile(null);
        setGymMemberships([]);
        setLoadedUserId(null);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setPasswordRecovery(false);
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
        setGymMemberships([]);
        setLoadedUserId(null);
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

  async function setHomeGym(gymId: number | null) {
    if (!session?.user) return;
    const { error } = await supabase.from('profiles').update({ home_gym_id: gymId }).eq('id', session.user.id);
    if (error) throw error;
    await loadProfile(session.user.id);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        gymMemberships,
        homeGym,
        loading,
        profileLoading: session != null && loadedUserId !== session.user.id,
        passwordRecovery,
        signOut,
        refreshProfile,
        setHomeGym,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
