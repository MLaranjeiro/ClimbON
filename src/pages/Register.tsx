import { AtSign, Loader2, Lock, User } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthField } from '../components/AuthField';
import { ErrorAlert } from '../components/ErrorAlert';
import { getErrorMessage } from '../lib/errors';
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
      setError(getErrorMessage(signUpError));
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
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
        <p className="text-gray-500 text-sm">
          We sent a confirmation link to {email}. Confirm your address, then log in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AuthField
        icon={User}
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <AuthField
        icon={AtSign}
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <div>
        <AuthField
          icon={Lock}
          type="password"
          placeholder="Password"
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
        {submitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
