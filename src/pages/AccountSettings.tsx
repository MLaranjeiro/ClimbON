import { Camera, Eye, EyeOff, Loader2, Pencil, Trash2 } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ErrorAlert } from '../components/ErrorAlert';
import { useAuth } from '../context/auth';
import { supabase } from '../lib/supabase';
import { validatePassword } from '../lib/validation';

export function AccountSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile picture
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Username + bio
  const [editingProfile, setEditingProfile] = useState(false);
  const [username, setUsername] = useState(profile?.username ?? '');
  const [bio, setBio] = useState(profile?.profile_bio ?? '');
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const passwordCheck = newPassword ? validatePassword(newPassword) : null;
  const initial = profile?.username?.charAt(0).toUpperCase() ?? '?';

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

  function handleStartEditProfile() {
    setUsername(profile?.username ?? '');
    setBio(profile?.profile_bio ?? '');
    setProfileError(null);
    setEditingProfile(true);
  }

  function handleCancelProfile() {
    setProfileError(null);
    setEditingProfile(false);
  }

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);

    if (!profile) return;

    setSavingProfile(true);

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ username, profile_bio: bio })
      .eq('id', profile.id);

    setSavingProfile(false);

    if (profileUpdateError) {
      setProfileError(
        profileUpdateError.code === '23505' ? 'That username is already taken.' : profileUpdateError.message,
      );
      return;
    }

    await refreshProfile();
    setEditingProfile(false);
  }

  function handleStartChangePassword() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
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
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Account settings</h1>

      <section className="card-light">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Profile picture</h2>
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-brand-700">{initial}</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="btn-primary text-sm flex items-center gap-2"
              >
                {avatarUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                Change photo
              </button>
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={avatarUploading || !profile?.avatar_url}
                className="btn-secondary-light text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            {avatarError && <ErrorAlert message={avatarError} light />}
          </div>
        </div>
      </section>

      <section className="card-light">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Account information</h2>
          {!editingProfile && (
            <button
              type="button"
              onClick={handleStartEditProfile}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Edit account information"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>

        {editingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm text-gray-600 mb-1">
                Username
              </label>
              <input
                id="username"
                className="input-field-light"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm text-gray-600 mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                className="input-field-light min-h-24"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {profileError && <ErrorAlert message={profileError} light />}

            <div className="flex gap-3">
              <button
                type="submit"
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={savingProfile}
              >
                {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" onClick={handleCancelProfile} className="btn-secondary-light flex-1">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Username</p>
              <p className="text-gray-900">{profile?.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bio</p>
              <p className="text-gray-900">{profile?.profile_bio || '—'}</p>
            </div>
          </div>
        )}
      </section>

      <section className="card-light">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Change password</h2>
          {!showPasswordForm && (
            <button
              type="button"
              onClick={handleStartChangePassword}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Change password"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>

        {showPasswordForm ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
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

            <div className="flex gap-3">
              <button
                type="submit"
                className="btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={changingPassword}
              >
                {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                {changingPassword ? 'Updating…' : 'Update password'}
              </button>
              <button type="button" onClick={handleCancelPassword} className="btn-secondary-light flex-1">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="text-gray-500 text-sm">••••••••</p>
        )}
      </section>
    </div>
  );
}
