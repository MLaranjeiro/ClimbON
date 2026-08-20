import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, ImagePlus, Loader2, Pencil, Plus, Trash2, XCircle } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Avatar } from '../components/Avatar';
import { ErrorAlert } from '../components/ErrorAlert';
import { useAuth } from '../context/auth';
import { GRADE_ORDER, getGradeBadgeClasses } from '../lib/grades';
import { isGymAdmin } from '../lib/permissions';
import { supabase } from '../lib/supabase';
import type { GymRole, RouteGrade, RouteStatus } from '../types';

interface RouteRow {
  id: number;
  route_name: string;
  grade: RouteGrade;
  status: RouteStatus;
  description: string | null;
  image_url: string | null;
  gym_id: number;
  section_id: number | null;
  gym: { gym_name: string } | null;
  section: { section_name: string } | null;
}

interface SectionOption {
  id: number;
  section_name: string;
}

interface TeamMemberRow {
  id: number;
  user_id: string;
  role: GymRole;
  profile: { username: string; email: string; avatar_url: string | null } | null;
}

interface UserOption {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
}

interface RouteFormState {
  routeName: string;
  gymId: string;
  sectionId: string;
  grade: RouteGrade;
  status: RouteStatus;
  description: string;
  imageUrl: string;
}

const EMPTY_FORM: RouteFormState = {
  routeName: '',
  gymId: '',
  sectionId: '',
  grade: 'V0',
  status: 'active',
  description: '',
  imageUrl: '',
};

type Tab = 'routes' | 'team';

export function AdminDashboard() {
  const { user, gymMemberships, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  const [selectedGymId, setSelectedGymId] = useState<number | null>(null);
  const effectiveGymId = selectedGymId ?? gymMemberships[0]?.gym_id ?? null;

  const [tab, setTab] = useState<Tab>('routes');
  const canManageTeam = isGymAdmin(gymMemberships, effectiveGymId);
  const effectiveTab: Tab = tab === 'team' && !canManageTeam ? 'routes' : tab;

  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['admin-routes', effectiveGymId],
    enabled: effectiveGymId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select(
          'id, route_name, grade, status, description, image_url, gym_id, section_id, gym:gyms(gym_name), section:sections(section_name)',
        )
        .eq('gym_id', effectiveGymId as number)
        .order('route_name');
      if (error) throw error;
      return data as unknown as RouteRow[];
    },
  });

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ['gym-team', effectiveGymId],
    enabled: effectiveGymId != null && canManageTeam,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gym_memberships')
        .select('id, user_id, role, profile:profiles(username, email, avatar_url)')
        .eq('gym_id', effectiveGymId as number);
      if (error) throw error;
      return data as unknown as TeamMemberRow[];
    },
  });

  const gymOptions = gymMemberships.map((m) => ({
    id: m.gym_id,
    gym_name: m.gym?.gym_name ?? `Gym ${m.gym_id}`,
  }));

  const [memberSearch, setMemberSearch] = useState('');
  const [roleByUser, setRoleByUser] = useState<Record<string, GymRole>>({});
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  const trimmedSearch = memberSearch.trim();

  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['user-search', trimmedSearch],
    enabled: trimmedSearch.length >= 2 && canManageTeam,
    queryFn: async () => {
      const q = trimmedSearch.replace(/[,()%]/g, '');
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url')
        .or(`username.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(10);
      if (error) throw error;
      return data as UserOption[];
    },
  });

  const teamUserIds = new Set((team ?? []).map((m) => m.user_id));
  const searchMatches = (searchResults ?? []).filter((u) => !teamUserIds.has(u.id));

  function roleFor(userId: string): GymRole {
    return roleByUser[userId] ?? 'route_setter';
  }

  async function addMember(userId: string) {
    if (!effectiveGymId) return;
    setAddingUserId(userId);
    setAddMemberError(null);

    const { error } = await supabase
      .from('gym_memberships')
      .insert({ user_id: userId, gym_id: effectiveGymId, role: roleFor(userId) });

    setAddingUserId(null);

    if (error) {
      setAddMemberError(error.code === '23505' ? 'That user already has a role at this gym.' : error.message);
      return;
    }

    setMemberSearch('');
    await queryClient.invalidateQueries({ queryKey: ['gym-team', effectiveGymId] });
  }

  const [formTarget, setFormTarget] = useState<RouteRow | 'new' | null>(null);
  const [form, setForm] = useState<RouteFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: formSections } = useQuery({
    queryKey: ['gym-sections', form.gymId],
    enabled: !!form.gymId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('id, section_name')
        .eq('gym_id', Number(form.gymId))
        .order('section_name');
      if (error) throw error;
      return data as SectionOption[];
    },
  });

  function openCreate() {
    setForm({ ...EMPTY_FORM, gymId: effectiveGymId ? String(effectiveGymId) : '' });
    setFormError(null);
    setFormTarget('new');
  }

  function openEdit(route: RouteRow) {
    setForm({
      routeName: route.route_name,
      gymId: String(route.gym_id),
      sectionId: route.section_id ? String(route.section_id) : '',
      grade: route.grade,
      status: route.status,
      description: route.description ?? '',
      imageUrl: route.image_url ?? '',
    });
    setFormError(null);
    setImageError(null);
    setFormTarget(route);
  }

  function closeForm() {
    setFormTarget(null);
    setFormError(null);
    setImageError(null);
  }

  async function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !form.gymId) return;

    setImageError(null);
    setImageUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${form.gymId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('route-images').upload(path, file);

    if (uploadError) {
      setImageUploading(false);
      setImageError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from('route-images').getPublicUrl(path);
    setImageUploading(false);
    setForm((f) => ({ ...f, imageUrl: data.publicUrl }));
  }

  function removeImage() {
    setForm((f) => ({ ...f, imageUrl: '' }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.gymId) {
      setFormError('Select a gym.');
      return;
    }

    setFormError(null);
    setSaving(true);

    const payload = {
      route_name: form.routeName.trim(),
      gym_id: Number(form.gymId),
      section_id: form.sectionId ? Number(form.sectionId) : null,
      grade: form.grade,
      status: form.status,
      description: form.description.trim() || null,
      image_url: form.imageUrl || null,
    };

    const { error } =
      formTarget === 'new'
        ? await supabase.from('routes').insert({ ...payload, created_by: user!.id })
        : await supabase.from('routes').update(payload).eq('id', (formTarget as RouteRow).id);

    setSaving(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['admin-routes', effectiveGymId] });
    setFormTarget(null);
  }

  async function toggleStatus(route: RouteRow) {
    setStatusUpdatingId(route.id);
    const nextStatus: RouteStatus = route.status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase.from('routes').update({ status: nextStatus }).eq('id', route.id);
    setStatusUpdatingId(null);
    if (!error) {
      await queryClient.invalidateQueries({ queryKey: ['admin-routes', effectiveGymId] });
    }
  }

  async function deleteRoute(route: RouteRow) {
    if (!window.confirm(`Delete "${route.route_name}"? This can't be undone.`)) return;

    setDeletingId(route.id);
    setDeleteError(null);
    const { error } = await supabase.from('routes').delete().eq('id', route.id);
    setDeletingId(null);

    if (error) {
      setDeleteError(
        error.code === '23503'
          ? 'This route can’t be deleted because people have already logged sends or beta on it. Deactivate it instead.'
          : error.message,
      );
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['admin-routes', effectiveGymId] });
  }

  async function revokeMember(member: TeamMemberRow) {
    setRevokingId(member.id);
    const { error } = await supabase.from('gym_memberships').delete().eq('id', member.id);
    setRevokingId(null);
    if (!error) {
      await queryClient.invalidateQueries({ queryKey: ['gym-team', effectiveGymId] });
      if (member.user_id === user?.id) {
        await refreshProfile();
      }
    }
  }

  const isCreating = formTarget === 'new';

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Route Setter admin</h1>
          <p className="text-gray-500 mt-1">Create, edit, and manage routes across your gyms.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {gymOptions.length > 1 && (
            <select
              className="input-field-light w-auto"
              value={effectiveGymId ?? ''}
              onChange={(e) => setSelectedGymId(Number(e.target.value))}
              aria-label="Gym being managed"
            >
              {gymOptions.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.gym_name}
                </option>
              ))}
            </select>
          )}
          <button type="button" onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add route
          </button>
        </div>
      </div>

      {canManageTeam && (
        <div className="flex items-center gap-1 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab('routes')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              effectiveTab === 'routes' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Routes
          </button>
          <button
            type="button"
            onClick={() => setTab('team')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              effectiveTab === 'team' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Team
          </button>
        </div>
      )}

      {effectiveTab === 'routes' && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {deleteError && (
            <div className="p-5 pb-0">
              <ErrorAlert message={deleteError} light />
            </div>
          )}
          {routesLoading ? (
            <p className="text-gray-500 text-sm p-5">Loading…</p>
          ) : !routes || routes.length === 0 ? (
            <p className="text-gray-500 text-sm p-5">No routes yet. Add your first route to get started.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Route</th>
                  <th className="px-5 py-3 font-medium">Gym</th>
                  <th className="px-5 py-3 font-medium">Section</th>
                  <th className="px-5 py-3 font-medium">Grade</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {routes.map((route) => (
                  <tr key={route.id}>
                    <td className="px-5 py-3 font-medium text-gray-900">{route.route_name}</td>
                    <td className="px-5 py-3 text-gray-600">{route.gym?.gym_name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-600">{route.section?.section_name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${getGradeBadgeClasses(route.grade)}`}>{route.grade}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`badge ${
                          route.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {route.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEdit(route)}
                          className="text-gray-500 hover:text-brand-600"
                          aria-label="Edit route"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(route)}
                          disabled={statusUpdatingId === route.id}
                          className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                          title={route.status === 'active' ? 'Deactivate route' : 'Activate route'}
                          aria-label={route.status === 'active' ? 'Deactivate route' : 'Activate route'}
                        >
                          {statusUpdatingId === route.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : route.status === 'active' ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteRoute(route)}
                          disabled={deletingId === route.id}
                          className="text-gray-500 hover:text-red-600 disabled:opacity-50"
                          title="Delete route"
                          aria-label="Delete route"
                        >
                          {deletingId === route.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {effectiveTab === 'team' && canManageTeam && (
        <section className="card-light">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Add a team member</h2>
          <input
            className="input-field-light"
            placeholder="Search by username or email"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
          {addMemberError && (
            <div className="mt-2">
              <ErrorAlert message={addMemberError} light />
            </div>
          )}
          {trimmedSearch.length >= 2 && (
            <div className="mt-3 space-y-2">
              {searching ? (
                <p className="text-sm text-gray-500">Searching…</p>
              ) : searchMatches.length === 0 ? (
                <p className="text-sm text-gray-500">No matching users.</p>
              ) : (
                searchMatches.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar src={u.avatar_url} name={u.username} size={32} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">{u.username}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        className="input-field-light w-auto py-1.5 text-sm"
                        value={roleFor(u.id)}
                        onChange={(e) => setRoleByUser((r) => ({ ...r, [u.id]: e.target.value as GymRole }))}
                        aria-label={`Role for ${u.username}`}
                      >
                        <option value="route_setter">Route Setter</option>
                        <option value="gym_admin">Gym Admin</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => addMember(u.id)}
                        disabled={addingUserId === u.id}
                        className="btn-primary text-sm py-1.5 px-3"
                      >
                        {addingUserId === u.id ? 'Adding…' : 'Add'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      )}

      {effectiveTab === 'team' && canManageTeam && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {teamLoading ? (
            <p className="text-gray-500 text-sm p-5">Loading…</p>
          ) : !team || team.length === 0 ? (
            <p className="text-gray-500 text-sm p-5">No team members yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-5 py-3 font-medium">Member</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {team.map((member) => (
                  <tr key={member.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={member.profile?.avatar_url} name={member.profile?.username} size={32} />
                        <div>
                          <p className="font-medium text-gray-900">{member.profile?.username ?? 'Unknown user'}</p>
                          <p className="text-xs text-gray-500">{member.profile?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`badge ${
                          member.role === 'gym_admin' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {member.role === 'gym_admin' ? 'Gym Admin' : 'Route Setter'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => revokeMember(member)}
                        disabled={revokingId === member.id}
                        className="text-gray-500 hover:text-red-600 disabled:opacity-50 text-sm font-medium"
                      >
                        {revokingId === member.id ? 'Revoking…' : 'Revoke'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {formTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{isCreating ? 'Add New Route' : 'Edit Route'}</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {isCreating
                    ? 'Fill in the details below to add a new climbing route.'
                    : 'Update the details for this route.'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={closeForm} className="btn-secondary-light text-sm">
                  Cancel
                </button>
                <button
                  type="submit"
                  form="route-form"
                  className="btn-primary text-sm flex items-center gap-2"
                  disabled={saving}
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Saving…' : isCreating ? 'Save Route' : 'Save Changes'}
                </button>
              </div>
            </div>

            <form id="route-form" onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="routeName" className="block text-sm text-gray-600 mb-1">
                    Route Name
                  </label>
                  <input
                    id="routeName"
                    className="input-field-light"
                    value={form.routeName}
                    onChange={(e) => setForm((f) => ({ ...f, routeName: e.target.value }))}
                    placeholder="Enter route name"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="grade" className="block text-sm text-gray-600 mb-1">
                    Grade
                  </label>
                  <select
                    id="grade"
                    className="input-field-light"
                    value={form.grade}
                    onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value as RouteGrade }))}
                  >
                    {GRADE_ORDER.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="gym" className="block text-sm text-gray-600 mb-1">
                    Gym
                  </label>
                  <select
                    id="gym"
                    className="input-field-light"
                    value={form.gymId}
                    onChange={(e) => setForm((f) => ({ ...f, gymId: e.target.value, sectionId: '' }))}
                    required
                  >
                    <option value="" disabled>
                      Select a gym
                    </option>
                    {gymOptions.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.gym_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="section" className="block text-sm text-gray-600 mb-1">
                    Section
                  </label>
                  <select
                    id="section"
                    className="input-field-light"
                    value={form.sectionId}
                    onChange={(e) => setForm((f) => ({ ...f, sectionId: e.target.value }))}
                    disabled={!form.gymId}
                  >
                    <option value="">No section</option>
                    {formSections?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.section_name}
                      </option>
                    ))}
                  </select>
                  {form.gymId && formSections && formSections.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">No sections set up for this gym yet.</p>
                  )}
                </div>

                {!isCreating && (
                  <div>
                    <label htmlFor="status" className="block text-sm text-gray-600 mb-1">
                      Status
                    </label>
                    <select
                      id="status"
                      className="input-field-light"
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as RouteStatus }))}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm text-gray-600 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  className="input-field-light min-h-28"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Describe the route, holds, cruxes, and beta."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Route Image</label>
                {form.imageUrl ? (
                  <div className="relative">
                    <img
                      src={form.imageUrl}
                      alt=""
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="bg-white/90 hover:bg-white text-gray-700 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-sm"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="bg-white/90 hover:bg-white text-red-600 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={imageUploading || !form.gymId}
                    className="w-full h-32 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 disabled:opacity-50"
                  >
                    {imageUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5" />
                        <span className="text-sm">
                          {form.gymId ? 'Click to upload an image' : 'Select a gym first'}
                        </span>
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                {imageError && (
                  <div className="mt-2">
                    <ErrorAlert message={imageError} light />
                  </div>
                )}
              </div>

              {formError && <ErrorAlert message={formError} light />}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
