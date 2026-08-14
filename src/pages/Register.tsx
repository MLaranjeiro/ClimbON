import { Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorAlert } from '../components/ErrorAlert';
import { supabase } from '../lib/supabase';
import { validatePassword } from '../lib/validation';

export function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const passwordCheck = validatePassword(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordCheck.valid) {
      setError(`Password needs: ${passwordCheck.errors.join(', ')}`);
      return;
    }

    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setConfirmSent(true);
      return;
    }

    navigate('/');
  }

  if (confirmSent) {
    return (
      <div className="card text-center">
        <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-gray-400">
          We sent a confirmation link to {email}. Confirm your address, then log in.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-white mb-4">Create account</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm text-gray-300 mb-1">
            Username
          </label>
          <input
            id="username"
            className="input-field"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
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
          <input
            id="password"
            type="password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {password.length > 0 && !passwordCheck.valid && (
            <ul className="mt-2 text-xs text-red-400 list-disc list-inside">
              {passwordCheck.errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </div>
        {error && <ErrorAlert message={error} />}
        <button
          type="submit"
          className="btn-primary w-full flex items-center justify-center gap-2"
          disabled={submitting}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-sm text-gray-400 text-center mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-500 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
