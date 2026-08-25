import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent } from 'react';
import { getGradeColorHex } from '../lib/grades';
import { GYM_AMENITIES } from '../lib/gymAmenities';
import { supabase } from '../lib/supabase';
import type { Gym, RouteGrade } from '../types';
import { ErrorAlert } from './ErrorAlert';

interface GymSectionRow {
  id: number;
  section_name: string;
}

interface GymRouteRow {
  id: number;
  route_name: string;
  grade: RouteGrade;
  section_id: number | null;
  map_x: number | null;
  map_y: number | null;
}

interface GymFormState {
  website: string;
  phone: string;
  instagramUrl: string;
  waiverUrl: string;
  city: string;
  locationAddress: string;
  amenities: string[];
  logoUrl: string;
  coverImageUrl: string;
  mapImageUrl: string;
}

function gymToFormState(gym: Gym): GymFormState {
  return {
    website: gym.website ?? '',
    phone: gym.phone ?? '',
    instagramUrl: gym.instagram_url ?? '',
    waiverUrl: gym.waiver_text ?? '',
    city: gym.city ?? '',
    locationAddress: gym.location_address ?? '',
    amenities: gym.amenities,
    logoUrl: gym.logo_url ?? '',
    coverImageUrl: gym.cover_image_url ?? '',
    mapImageUrl: gym.map_image_url ?? '',
  };
}

export function GymProfileEditor({ gymId }: { gymId: number }) {
  const queryClient = useQueryClient();

  const { data: gym, isLoading: gymLoading } = useQuery({
    queryKey: ['gym', gymId],
    queryFn: async () => {
      const { data, error } = await supabase.from('gyms').select('*').eq('id', gymId).single();
      if (error) throw error;
      return data as Gym;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ['gym-sections-full', gymId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('id, section_name')
        .eq('gym_id', gymId)
        .order('section_name');
      if (error) throw error;
      return data as GymSectionRow[];
    },
  });

  const { data: mapRoutes, isLoading: mapRoutesLoading } = useQuery({
    queryKey: ['gym-routes-full', gymId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('id, route_name, grade, section_id, map_x, map_y')
        .eq('gym_id', gymId)
        .eq('status', 'active')
        .order('route_name');
      if (error) throw error;
      return data as GymRouteRow[];
    },
  });

  const [form, setForm] = useState<GymFormState | null>(null);
  const activeForm = form ?? (gym ? gymToFormState(gym) : null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [mapUploading, setMapUploading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapInputRef = useRef<HTMLInputElement>(null);

  const [placingRouteId, setPlacingRouteId] = useState<number | null>(null);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [routeWallFilter, setRouteWallFilter] = useState<number | null>(null);
  const [routeSearch, setRouteSearch] = useState('');

  function updateForm(patch: Partial<GymFormState>) {
    setForm({ ...(activeForm as GymFormState), ...patch });
    setSaved(false);
  }

  function toggleAmenity(amenity: string) {
    if (!activeForm) return;
    const has = activeForm.amenities.includes(amenity);
    updateForm({
      amenities: has ? activeForm.amenities.filter((a) => a !== amenity) : [...activeForm.amenities, amenity],
    });
  }

  async function uploadAsset(file: File, kind: 'logo' | 'cover' | 'map') {
    const ext = file.name.split('.').pop();
    const path = `${gymId}/${kind}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('gym-assets').upload(path, file);
    if (error) throw error;
    return supabase.storage.from('gym-assets').getPublicUrl(path).data.publicUrl;
  }

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLogoError(null);
    setLogoUploading(true);
    try {
      const url = await uploadAsset(file, 'logo');
      updateForm({ logoUrl: url });
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Upload failed.');
    }
    setLogoUploading(false);
  }

  async function handleCoverChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCoverError(null);
    setCoverUploading(true);
    try {
      const url = await uploadAsset(file, 'cover');
      updateForm({ coverImageUrl: url });
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Upload failed.');
    }
    setCoverUploading(false);
  }

  async function handleMapChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMapError(null);
    setMapUploading(true);
    try {
      const url = await uploadAsset(file, 'map');
      updateForm({ mapImageUrl: url });
    } catch (err) {
      setMapError(err instanceof Error ? err.message : 'Upload failed.');
    }
    setMapUploading(false);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!activeForm) return;
    setSaving(true);
    setSaveError(null);

    const { error } = await supabase
      .from('gyms')
      .update({
        website: activeForm.website.trim() || null,
        phone: activeForm.phone.trim() || null,
        instagram_url: activeForm.instagramUrl.trim() || null,
        waiver_text: activeForm.waiverUrl.trim() || null,
        city: activeForm.city.trim() || null,
        location_address: activeForm.locationAddress.trim() || null,
        amenities: activeForm.amenities,
        logo_url: activeForm.logoUrl || null,
        cover_image_url: activeForm.coverImageUrl || null,
        map_image_url: activeForm.mapImageUrl || null,
      })
      .eq('id', gymId);

    setSaving(false);

    if (error) {
      setSaveError(error.message);
      return;
    }

    setSaved(true);
    await queryClient.invalidateQueries({ queryKey: ['gym', gymId] });
    await queryClient.invalidateQueries({ queryKey: ['gyms'] });
  }

  async function placeOnMap(e: MouseEvent<HTMLImageElement>) {
    if (placingRouteId == null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));

    setPlaceError(null);
    const { error } = await supabase.from('routes').update({ map_x: x, map_y: y }).eq('id', placingRouteId);
    setPlacingRouteId(null);

    if (error) {
      setPlaceError(error.message);
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['gym-routes-full', gymId] });
  }

  async function clearPosition(id: number) {
    const { error } = await supabase.from('routes').update({ map_x: null, map_y: null }).eq('id', id);
    if (!error) {
      await queryClient.invalidateQueries({ queryKey: ['gym-routes-full', gymId] });
    }
  }

  if (gymLoading || !activeForm) {
    return (
      <div className="card-light">
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card-light">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Gym Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gymCity" className="block text-sm text-gray-600 mb-1">
                City
              </label>
              <input
                id="gymCity"
                className="input-field-light"
                value={activeForm.city}
                onChange={(e) => updateForm({ city: e.target.value })}
                placeholder="e.g. Toronto"
              />
              <p className="text-xs text-gray-500 mt-1">Shown on the gym card.</p>
            </div>
            <div>
              <label htmlFor="gymLocation" className="block text-sm text-gray-600 mb-1">
                Full address
              </label>
              <input
                id="gymLocation"
                className="input-field-light"
                value={activeForm.locationAddress}
                onChange={(e) => updateForm({ locationAddress: e.target.value })}
                placeholder="Street address"
              />
              <p className="text-xs text-gray-500 mt-1">Shown on the gym's Info page.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="gymWebsite" className="block text-sm text-gray-600 mb-1">
                Website
              </label>
              <input
                id="gymWebsite"
                className="input-field-light"
                value={activeForm.website}
                onChange={(e) => updateForm({ website: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div>
              <label htmlFor="gymPhone" className="block text-sm text-gray-600 mb-1">
                Phone
              </label>
              <input
                id="gymPhone"
                className="input-field-light"
                value={activeForm.phone}
                onChange={(e) => updateForm({ phone: e.target.value })}
                placeholder="(555) 555-5555"
              />
            </div>
            <div>
              <label htmlFor="gymInstagram" className="block text-sm text-gray-600 mb-1">
                Instagram
              </label>
              <input
                id="gymInstagram"
                className="input-field-light"
                value={activeForm.instagramUrl}
                onChange={(e) => updateForm({ instagramUrl: e.target.value })}
                placeholder="https://instagram.com/…"
              />
            </div>
          </div>

          <div>
            <label htmlFor="gymWaiver" className="block text-sm text-gray-600 mb-1">
              Link to Waiver
            </label>
            <input
              id="gymWaiver"
              type="url"
              className="input-field-light"
              value={activeForm.waiverUrl}
              onChange={(e) => updateForm({ waiverUrl: e.target.value })}
              placeholder="https://…"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-2">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {GYM_AMENITIES.map((amenity) => {
                const active = activeForm.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`badge cursor-pointer ${active ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {amenity}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Cover photo</label>
            <p className="text-xs text-gray-500 mb-2">Shown as the background on this gym's card in the gym picker.</p>
            {activeForm.coverImageUrl ? (
              <div className="relative">
                <img
                  src={activeForm.coverImageUrl}
                  alt=""
                  className="w-full h-40 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="bg-white/90 hover:bg-white text-gray-700 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-sm"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm({ coverImageUrl: '' })}
                    className="bg-white/90 hover:bg-white text-red-600 text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={coverUploading}
                className="w-full h-32 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 disabled:opacity-50"
              >
                {coverUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-sm">Click to upload a cover photo</span>
                  </>
                )}
              </button>
            )}
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            {coverError && (
              <div className="mt-2">
                <ErrorAlert message={coverError} light />
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Logo</label>
              {activeForm.logoUrl ? (
                <div className="relative w-24 h-24">
                  <img
                    src={activeForm.logoUrl}
                    alt=""
                    className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => updateForm({ logoUrl: '' })}
                    className="absolute -top-2 -right-2 bg-white border border-gray-300 rounded-full p-0.5 shadow-sm"
                    aria-label="Remove logo"
                  >
                    <X className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="w-24 h-24 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 disabled:opacity-50"
                >
                  {logoUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                </button>
              )}
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              {logoError && (
                <div className="mt-2">
                  <ErrorAlert message={logoError} light />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Map image</label>
              {activeForm.mapImageUrl ? (
                <div className="relative">
                  <img
                    src={activeForm.mapImageUrl}
                    alt=""
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => mapInputRef.current?.click()}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded-lg shadow-sm"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => mapInputRef.current?.click()}
                  disabled={mapUploading}
                  className="w-full h-24 flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 disabled:opacity-50"
                >
                  {mapUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                </button>
              )}
              <input ref={mapInputRef} type="file" accept="image/*" className="hidden" onChange={handleMapChange} />
              {mapError && (
                <div className="mt-2">
                  <ErrorAlert message={mapError} light />
                </div>
              )}
            </div>
          </div>

          {saveError && <ErrorAlert message={saveError} light />}

          <div className="flex items-center gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Saving…' : 'Save'}
            </button>
            {saved && <span className="text-sm text-green-700">Saved.</span>}
          </div>
        </form>
      </section>

      {activeForm.mapImageUrl && (
        <section className="card-light">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Place routes on the map</h2>
          <p className="text-sm text-gray-500 mb-4">
            Walls are already labeled in the map image itself — pick a wall, then click "Place on map" next to a
            route and click the map where it is.
          </p>
          {placeError && (
            <div className="mb-3">
              <ErrorAlert message={placeError} light />
            </div>
          )}
          <div className="grid lg:grid-cols-[1fr_260px] gap-4">
            <div className="relative">
              <img
                src={activeForm.mapImageUrl}
                alt=""
                onClick={placeOnMap}
                className={`w-full rounded-lg border border-gray-200 ${
                  placingRouteId != null ? 'cursor-crosshair' : ''
                }`}
              />
              {(mapRoutes ?? [])
                .filter((r) => r.map_x != null && r.map_y != null)
                .map((r) => (
                  <div
                    key={r.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow pointer-events-none"
                    style={{ left: `${r.map_x}%`, top: `${r.map_y}%`, backgroundColor: getGradeColorHex(r.grade) }}
                    title={`${r.route_name} (${r.grade})`}
                  />
                ))}
            </div>
            <div className="space-y-2">
              <select
                className="input-field-light text-sm"
                value={routeWallFilter ?? ''}
                onChange={(e) => setRouteWallFilter(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">All walls</option>
                {(sections ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.section_name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="input-field-light text-sm"
                placeholder="Search routes…"
                value={routeSearch}
                onChange={(e) => setRouteSearch(e.target.value)}
              />
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {mapRoutesLoading ? (
                  <p className="text-sm text-gray-500">Loading…</p>
                ) : (
                  (() => {
                    const filtered = (mapRoutes ?? [])
                      .filter((r) => routeWallFilter == null || r.section_id === routeWallFilter)
                      .filter((r) => r.route_name.toLowerCase().includes(routeSearch.toLowerCase()));
                    if (filtered.length === 0) {
                      return <p className="text-sm text-gray-500">No routes match.</p>;
                    }
                    return filtered.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: getGradeColorHex(r.grade) }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{r.route_name}</p>
                            <p className="text-xs text-gray-500">
                              {r.grade} · {r.map_x != null ? 'Placed' : 'Not placed'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPlacingRouteId(r.id)}
                            className={`text-xs font-medium ${
                              placingRouteId === r.id ? 'text-brand-600' : 'text-gray-500 hover:text-brand-600'
                            }`}
                          >
                            {placingRouteId === r.id ? 'Click the map…' : 'Place on map'}
                          </button>
                          {r.map_x != null && (
                            <button
                              type="button"
                              onClick={() => clearPosition(r.id)}
                              className="text-xs font-medium text-gray-500 hover:text-red-600"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    ));
                  })()
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
