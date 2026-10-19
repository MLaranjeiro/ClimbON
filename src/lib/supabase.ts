import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.');
}

// A password-reset email link signs the user in with tokens in the URL, and the client
// strips those tokens as soon as it's created — so record that this visit came from a
// recovery link first. AuthProvider reads this to keep the user on /reset-password
// instead of treating the link as a normal login.
export const PASSWORD_RECOVERY_FLAG = 'climbon:password-recovery';

if (
  typeof window !== 'undefined' &&
  /(^|[#?&])type=recovery(&|$)/.test(window.location.hash + window.location.search)
) {
  try {
    sessionStorage.setItem(PASSWORD_RECOVERY_FLAG, '1');
  } catch {
    // Storage blocked — the PASSWORD_RECOVERY auth event still covers this case.
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
