import { useQuery } from '@tanstack/react-query';
import { Mountain, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { GymProfileEditor } from '../components/GymProfileEditor';
import { supabase } from '../lib/supabase';

interface GymListItem {
  id: number;
  gym_name: string;
  city: string | null;
  logo_url: string | null;
}

export function PlatformGyms() {
  const [query, setQuery] = useState('');
  const [selectedGymId, setSelectedGymId] = useState<number | null>(null);

  const { data: gyms, isLoading } = useQuery({
    queryKey: ['gyms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gyms')
        .select('id, gym_name, city, logo_url')
        .order('gym_name');
      if (error) throw error;
      return data as GymListItem[];
    },
  });

  const q = query.trim().toLowerCase();
  const matches = (gyms ?? []).filter(
    (g) => !q || g.gym_name.toLowerCase().includes(q) || g.city?.toLowerCase().includes(q),
  );

  const effectiveGymId = selectedGymId ?? matches[0]?.id ?? null;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Gyms</h1>
        <p className="text-gray-500 mt-1">
          Edit any gym's profile directly. Individual gym admins don't have their own editing tab for this.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="w-full lg:w-64 shrink-0 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="input-field-light pl-9"
              placeholder="Search gyms"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : matches.length === 0 ? (
            <p className="text-gray-500 text-sm">No gyms found.</p>
          ) : (
            <ul className="space-y-1 max-h-[70vh] overflow-y-auto">
              {matches.map((gym) => (
                <li key={gym.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedGymId(gym.id)}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                      effectiveGymId === gym.id ? 'bg-brand-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20 flex items-center justify-center shrink-0">
                      {gym.logo_url ? (
                        <img src={gym.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Mountain className={`w-3.5 h-3.5 ${effectiveGymId === gym.id ? 'text-white' : 'text-gray-400'}`} />
                      )}
                    </div>
                    <span className="min-w-0 truncate">{gym.gym_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="flex items-start gap-1.5 text-xs text-gray-500">
            <Plus className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            New gyms are added directly in Supabase, then show up here to edit.
          </p>
        </div>

        <div className="flex-1 min-w-0 w-full">
          {effectiveGymId != null ? (
            <GymProfileEditor key={effectiveGymId} gymId={effectiveGymId} />
          ) : (
            <p className="text-gray-500 text-sm">Select a gym to edit its profile.</p>
          )}
        </div>
      </div>
    </div>
  );
}
