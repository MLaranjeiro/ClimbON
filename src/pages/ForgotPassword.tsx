import { AtSign, Loader2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { AuthField } from '../components/AuthField';
import { ErrorAlert } from '../components/ErrorAlert';
import { getErrorMessage, logError } from '../lib/errors';
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
      setError(getErrorMessage(resetError));
      logError('forgot-password.request', resetError, { email });
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-500 text-sm">
          If an account exists for {email}, a password reset link is on its way.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AuthField
        icon={AtSign}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      {error && <ErrorAlert message={error} light />}

      <button
        type="submit"
        className="btn-primary w-full rounded-full flex items-center justify-center gap-2"
        disabled={submitting}
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  );
}
