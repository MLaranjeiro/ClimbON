import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
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
    <div className="card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-gray-300 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-gray-300 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className="input-field pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-right mt-1">
            <Link to="/forgot-password" className="text-sm text-brand-500 hover:underline">
              Forgot Password?
            </Link>
          </div>
        </div>
        {error && <ErrorAlert message={error} />}
        <button
          type="submit"
          className="btn-primary w-full flex items-center justify-center gap-2"
          disabled={submitting}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1 bg-surface-600" />
        <span className="text-xs text-gray-500">or</span>
        <div className="h-px flex-1 bg-surface-600" />
      </div>

      <button
        type="button"
        disabled
        title="Google sign-in isn't set up yet"
        className="w-full flex items-center justify-center gap-2 bg-surface-700 text-gray-400 font-semibold py-2.5 px-5 rounded-lg cursor-not-allowed opacity-60"
      >
        <FcGoogle className="w-4 h-4" />
        Continue with Google
      </button>

      <p className="text-sm text-gray-400 text-center mt-6">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-brand-500 hover:underline">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
