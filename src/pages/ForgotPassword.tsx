import { Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ErrorAlert } from '../components/ErrorAlert';
import { supabase } from '../lib/supabase';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="card text-center">
        <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-gray-400">
          If an account exists for {email}, a password reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-xl font-bold text-white mb-4">Reset password</h2>
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
        {error && <ErrorAlert message={error} />}
        <button
          type="submit"
          className="btn-primary w-full flex items-center justify-center gap-2"
          disabled={submitting}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
      <p className="text-sm text-gray-400 text-center mt-6">
        <Link to="/login" className="text-brand-500 hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
