import { Camera, Eye, EyeOff, Loader2, Pencil } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ErrorAlert } from '../components/ErrorAlert';
import { useAuth } from '../context/auth';
import { supabase } from '../lib/supabase';
import { validatePassword } from '../lib/validation';

const TABS = [
  { id: 'profile', label: 'My Profile' },
  { id: 'account', label: 'My Account' },
] as const;

type Tab = (typeof TABS)[number]['id'];
type ProfileField = 'username' | 'profile_bio';

export function AccountSettings() {
  const { user, profile, gymMemberships, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>('profile');

  // Profile picture
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Inline field editing (name / bio)
  const [editingField, setEditingField] = useState<ProfileField | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [savingField, setSavingField] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const passwordCheck = newPassword ? validatePassword(newPassword) : null;
  const initial = profile?.username?.charAt(0).toUpperCase() ?? '?';
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !profile) return;

    setAvatarError(null);
    setAvatarUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setAvatarUploading(false);
      setAvatarError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: `${data.publicUrl}?t=${Date.now()}` })
      .eq('id', profile.id);

    setAvatarUploading(false);

    if (updateError) {
      setAvatarError(updateError.message);
      return;
    }

    await refreshProfile();
  }

  async function handleRemovePhoto() {
    if (!profile) return;
    setAvatarError(null);
    setAvatarUploading(true);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', profile.id);

    setAvatarUploading(false);

    if (updateError) {
      setAvatarError(updateError.message);
      return;
    }

    await refreshProfile();
  }

  function startEditField(field: ProfileField, currentValue: string) {
    setFieldError(null);
    setFieldValue(currentValue);
    setEditingField(field);
  }

  function cancelEditField() {
    setFieldError(null);
    setEditingField(null);
  }

  async function saveField(e: FormEvent) {
    e.preventDefault();
    if (!profile || !editingField) return;

    setFieldError(null);
    setSavingField(true);

    const { error } = await supabase
      .from('profiles')
      .update({ [editingField]: fieldValue })
      .eq('id', profile.id);

    setSavingField(false);

    if (error) {
      setFieldError(error.code === '23505' ? 'That username is already taken.' : error.message);
      return;
    }

    await refreshProfile();
    setEditingField(null);
  }

  function handleStartChangePassword() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setPasswordSuccess(false);
    setShowPasswordForm(true);
  }

  function handleCancelPassword() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
    setShowPasswordForm(false);
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError('Enter your current password.');
      return;
    }

    if (!passwordCheck?.valid) {
      setPasswordError(`New password needs: ${passwordCheck?.errors.join(', ')}`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (!user?.email) return;

    setChangingPassword(true);

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (reauthError) {
      setChangingPassword(false);
      setPasswordError('Current password is incorrect.');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    setChangingPassword(false);

    if (updateError) {
      setPasswordError(updateError.message);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);
    setPasswordSuccess(true);
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row gap-10">
        <nav className="w-full sm:w-52 shrink-0">
          <ul className="space-y-1">
            {TABS.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    tab === t.id ? 'bg-brand-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 min-w-0">
          {tab === 'profile' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 pb-4 mb-2 border-b border-gray-200">My Profile</h1>

              <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-x-6 sm:gap-x-8 py-6 border-b border-gray-200 items-start">
                <div className="text-sm text-gray-500 sm:text-right pt-2">Current Photo</div>
                <div>
                  <div className="relative w-24 h-24">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-brand-700">{initial}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm hover:bg-gray-50"
                      aria-label="Change photo"
                    >
                      {avatarUploading ? (
                        <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  {profile?.avatar_url && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={avatarUploading}
                      className="block mt-2 text-sm text-brand-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                  {avatarError && <div className="mt-2"><ErrorAlert message={avatarError} light /></div>}
                </div>
              </div>

              <div
                className={`grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-x-6 sm:gap-x-8 py-5 border-b border-gray-200 group ${
                  editingField === 'username' ? 'items-start' : 'items-center'
                }`}
              >
                <div className="text-sm text-gray-500 sm:text-right">Name</div>
                <div>
                  {editingField === 'username' ? (
                    <form onSubmit={saveField} className="flex flex-wrap items-center gap-3 max-w-sm">
                      <input
                        className="input-field-light"
                        value={fieldValue}
                        onChange={(e) => setFieldValue(e.target.value)}
                        autoFocus
                        required
                      />
                      <button type="submit" className="text-brand-600 text-sm font-semibold" disabled={savingField}>
                        {savingField ? 'Saving…' : 'Save'}
                      </button>
                      <button type="button" onClick={cancelEditField} className="text-gray-500 text-sm">
                        Cancel
                      </button>
                      {fieldError && (
                        <div className="w-full"><ErrorAlert message={fieldError} light /></div>
                      )}
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditField('username', profile?.username ?? '')}
                      className="flex items-center gap-2 text-gray-900 font-semibold hover:text-brand-600"
                    >
                      {profile?.username}
                      <Pencil className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100" />
                    </button>
                  )}
                </div>
              </div>

              <div
                className={`grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-x-6 sm:gap-x-8 py-5 border-b border-gray-200 group ${
                  editingField === 'profile_bio' ? 'items-start' : 'items-center'
                }`}
              >
                <div className="text-sm text-gray-500 sm:text-right">Profile Bio</div>
                <div>
                  {editingField === 'profile_bio' ? (
                    <form onSubmit={saveField} className="max-w-sm space-y-2">
                      <textarea
                        className="input-field-light min-h-24"
                        value={fieldValue}
                        onChange={(e) => setFieldValue(e.target.value)}
                        autoFocus
                      />
                      <div className="flex items-center gap-3">
                        <button type="submit" className="text-brand-600 text-sm font-semibold" disabled={savingField}>
                          {savingField ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" onClick={cancelEditField} className="text-gray-500 text-sm">
                          Cancel
                        </button>
                      </div>
                      {fieldError && <ErrorAlert message={fieldError} light />}
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditField('profile_bio', profile?.profile_bio ?? '')}
                      className="flex items-center gap-2 text-left text-gray-900 hover:text-brand-600"
                    >
                      <span>{profile?.profile_bio || '—'}</span>
                      <Pencil className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {tab === 'account' && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 pb-4 mb-2 border-b border-gray-200">My Account</h1>

              <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-x-6 sm:gap-x-8 py-5 border-b border-gray-200 items-center">
                <div className="text-sm text-gray-500 sm:text-right">Email</div>
                <div className="text-gray-900">{user?.email}</div>
              </div>

              <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-x-6 sm:gap-x-8 py-5 border-b border-gray-200 items-center">
                <div className="text-sm text-gray-500 sm:text-right">Gym roles</div>
                <div>
                  {gymMemberships.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No gym roles yet — a gym admin can add you as a route setter.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {gymMemberships.map((m) => (
                        <span key={m.id} className="badge bg-gray-100 text-gray-700">
                          {m.gym?.gym_name ?? `Gym ${m.gym_id}`} · {m.role === 'gym_admin' ? 'Gym Admin' : 'Route Setter'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {profile?.is_platform_admin && (
                <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-x-6 sm:gap-x-8 py-5 border-b border-gray-200 items-center">
                  <div className="text-sm text-gray-500 sm:text-right">Platform</div>
                  <span className="badge bg-violet-100 text-violet-700">Platform admin</span>
                </div>
              )}

              {memberSince && (
                <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-x-6 sm:gap-x-8 py-5 border-b border-gray-200 items-center">
                  <div className="text-sm text-gray-500 sm:text-right">Member since</div>
                  <div className="text-gray-900">{memberSince}</div>
                </div>
              )}

              <div
                className={`grid grid-cols-[110px_1fr] sm:grid-cols-[140px_1fr] gap-x-6 sm:gap-x-8 py-5 border-b border-gray-200 group ${
                  showPasswordForm ? 'items-start' : 'items-center'
                }`}
              >
                <div className="text-sm text-gray-500 sm:text-right">Password</div>
                <div>
                  {showPasswordForm ? (
                    <form onSubmit={handleChangePassword} className="max-w-sm space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm text-gray-600 mb-1">
                          Current password
                        </label>
                        <div className="relative">
                          <input
                            id="currentPassword"
                            type={showCurrentPassword ? 'text' : 'password'}
                            className="input-field-light pr-10"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword((v) => !v)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700"
                            aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                          >
                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="block text-sm text-gray-600 mb-1">
                          New password
                        </label>
                        <div className="relative">
                          <input
                            id="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            className="input-field-light pr-10"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((v) => !v)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700"
                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {newPassword.length > 0 && !passwordCheck?.valid && (
                          <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
                            {passwordCheck?.errors.map((err) => <li key={err}>{err}</li>)}
                          </ul>
                        )}
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm text-gray-600 mb-1">
                          Confirm new password
                        </label>
                        <div className="relative">
                          <input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            className="input-field-light pr-10"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((v) => !v)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {confirmPassword.length > 0 && confirmPassword !== newPassword && (
                          <p className="mt-2 text-xs text-red-600">Passwords do not match</p>
                        )}
                      </div>

                      {passwordError && <ErrorAlert message={passwordError} light />}

                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          className="btn-primary text-sm flex items-center justify-center gap-2"
                          disabled={changingPassword}
                        >
                          {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                          {changingPassword ? 'Updating…' : 'Update password'}
                        </button>
                        <button type="button" onClick={handleCancelPassword} className="text-gray-500 text-sm">
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleStartChangePassword}
                        className="flex items-center gap-2 text-gray-900 font-semibold hover:text-brand-600"
                      >
                        ••••••••
                        <Pencil className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100" />
                      </button>
                      {passwordSuccess && (
                        <p className="text-sm text-green-700 mt-2">Password updated.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
