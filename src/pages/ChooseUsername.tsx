import { Loader2, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import icon from '../assets/climbon-icon.png';
import { AuthField } from '../components/AuthField';
import { ErrorAlert } from '../components/ErrorAlert';
import { useAuth } from '../context/auth';
import { getErrorMessage, logError } from '../lib/errors';
import { supabase } from '../lib/supabase';

export function ChooseUsername() {
  const { session, profile, loading, refreshProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (profile?.username_confirmed) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = username.trim();
    if (!trimmed) {
      setError('Enter a username.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: trimmed, username_confirmed: true })
      .eq('id', session!.user.id);
    setSubmitting(false);

    if (updateError) {
      setError(updateError.code === '23505' ? 'That username is already taken.' : getErrorMessage(updateError));
      logError('choose-username.save', updateError, { userId: session!.user.id });
      return;
    }

    await refreshProfile();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-gray-900 mb-2">
          <img src={icon} alt="" className="w-7 h-7" />
          ClimbON
        </div>
        <h1 className="text-lg font-semibold text-gray-900 text-center mb-1">Choose a username</h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          One more step — pick a username other climbers will see.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <AuthField
            icon={User}
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />

          {error && <ErrorAlert message={error} light />}

          <button
            type="submit"
            className="btn-primary w-full rounded-full flex items-center justify-center gap-2"
            disabled={submitting}
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Saving…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
