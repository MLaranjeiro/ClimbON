import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthField } from '../components/AuthField';
import { ErrorAlert } from '../components/ErrorAlert';
import { useAuth } from '../context/auth';
import { getErrorMessage, logError } from '../lib/errors';
import { supabase } from '../lib/supabase';
import { missingFieldsMessage, validatePassword } from '../lib/validation';

export function ResetPassword() {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updated, setUpdated] = useState(false);

  const passwordCheck = validatePassword(password);

  // Reaching this page without a recovery session means the link expired, was already
  // used, or the page was opened directly.
  if (!session && !updated) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Reset link expired</h2>
        <p className="text-gray-500 text-sm mb-6">
          This password reset link is invalid or has already been used. Request a new one to continue.
        </p>
        <Link to="/forgot-password" className="btn-primary w-full rounded-full inline-flex justify-center">
          Send a new reset link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const missing = missingFieldsMessage({ 'New password': password, 'Password confirmation': confirmPassword });
    if (missing) {
      setError(missing);
      return;
    }
    if (!passwordCheck.valid) {
      setError(`Password needs: ${passwordCheck.errors.join(', ')}`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setSubmitting(false);
      setError(getErrorMessage(updateError));
      logError('reset-password.update', updateError);
      return;
    }

    // Sign out so the reset link's session ends here — the user proves the new
    // password works by logging in with it.
    setUpdated(true);
    await signOut();
    navigate('/login', {
      replace: true,
      state: { notice: 'Your password has been updated. Log in with your new password.' },
    });
  }

  const visibilityToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      className="text-gray-400 hover:text-gray-600 shrink-0"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Reset your password</h2>
        <p className="text-gray-500 text-sm">
          Choose a new password{session?.user.email ? ` for ${session.user.email}` : ''}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div>
          <AuthField
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            placeholder="New password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            trailing={visibilityToggle}
          />
          {password.length > 0 && !passwordCheck.valid && (
            <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
              {passwordCheck.errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          )}
        </div>

        <AuthField
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

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
