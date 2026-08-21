import { Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
import { AuthField } from '../components/AuthField';
import { ErrorAlert } from '../components/ErrorAlert';
import { getHomeRoute } from '../lib/getHomeRoute';
import { supabase } from '../lib/supabase';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });

    if (oauthError) {
      setGoogleLoading(false);
      setError(oauthError.message);
    }
    // On success the browser navigates to Google, so there's nothing else to do here.
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError || !data.user) {
      setSubmitting(false);
      setError(signInError?.message ?? 'Something went wrong. Please try again.');
      return;
    }

    const { data: memberships } = await supabase
      .from('gym_memberships')
      .select('gym_id, role')
      .eq('user_id', data.user.id);

    setSubmitting(false);
    navigate(getHomeRoute(memberships ?? null));
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <AuthField
          icon={User}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <AuthField
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-gray-400 hover:text-gray-600 shrink-0"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        {error && <ErrorAlert message={error} light />}

        <div className="flex items-center justify-between gap-4">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
            Forgot Password?
          </Link>
          <button
            type="submit"
            className="btn-primary rounded-full px-8 flex items-center gap-2 shrink-0"
            disabled={submitting}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Logging in…' : 'Login'}
          </button>
        </div>
      </form>

      <div className="flex items-center justify-center gap-2 mt-10 text-sm text-gray-500">
        <span>Or Login With</span>
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="flex items-center gap-1.5 font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
        >
          {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FcGoogle className="w-4 h-4" />}
          Google
        </button>
      </div>
    </>
  );
}
