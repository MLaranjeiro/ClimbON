import { Loader2, Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthField } from '../components/AuthField';
import { ErrorAlert } from '../components/ErrorAlert';
import { supabase } from '../lib/supabase';
import { validatePassword } from '../lib/validation';

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordCheck = validatePassword(password);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!passwordCheck.valid) {
      setError(`Password needs: ${passwordCheck.errors.join(', ')}`);
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    navigate('/login');
  }

  return (
    <>
      <p className="text-gray-500 text-sm text-center mb-6">
        Followed the link from your email — pick a new password below.
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <AuthField
            icon={Lock}
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {password.length > 0 && !passwordCheck.valid && (
            <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
              {passwordCheck.errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </div>

        {error && <ErrorAlert message={error} light />}

        <button
          type="submit"
          className="btn-primary w-full rounded-full flex items-center justify-center gap-2"
          disabled={submitting}
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </>
  );
}
