import { Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
import { AuthField } from '../components/AuthField';
import { ErrorAlert } from '../components/ErrorAlert';
import { getErrorMessage, logError } from '../lib/errors';
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
      setError(getErrorMessage(oauthError));
      logError('login.google-oauth', oauthError);
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
      setError(signInError ? getErrorMessage(signInError) : 'Something went wrong. Please try again.');
      return;
    }

    setSubmitting(false);
    navigate(getHomeRoute());
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

        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:underline">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          className="btn-primary w-full rounded-full flex items-center justify-center gap-2"
          disabled={submitting}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <div className="flex items-center gap-3 mt-8 text-xs font-medium text-gray-400">
        <div className="h-px flex-1 bg-gray-200" />
        <span>OR</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="w-full mt-6 flex items-center justify-center gap-2 rounded-full border border-gray-200 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FcGoogle className="w-4 h-4" />}
        {googleLoading ? 'Redirecting…' : 'Continue with Google'}
      </button>
    </>
  );
}
