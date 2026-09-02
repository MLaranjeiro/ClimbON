import { useQuery } from '@tanstack/react-query';
import { Mountain, Search, Star } from 'lucide-react';
import { useState, type MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth';
import { supabase } from '../lib/supabase';

interface GymOption {
  id: number;
  gym_name: string;
  slug: string;
  city: string | null;
  location_address: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
}

export function GymPicker() {
  const [query, setQuery] = useState('');
  const { homeGym, setHomeGym } = useAuth();
  const [favoriting, setFavoriting] = useState<number | null>(null);

  const { data: gyms, isLoading } = useQuery({
    queryKey: ['gyms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gyms')
        .select('id, gym_name, slug, city, location_address, logo_url, cover_image_url')
        .order('gym_name');
      if (error) throw error;
      return data as GymOption[];
    },
  });

  async function handleToggleFavorite(e: MouseEvent, gymId: number) {
    e.preventDefault();
    e.stopPropagation();
    setFavoriting(gymId);
    try {
      await setHomeGym(homeGym?.id === gymId ? null : gymId);
    } finally {
      setFavoriting(null);
    }
  }

  const q = query.trim().toLowerCase();
  const matches = (gyms ?? []).filter(
    (g) =>
      !q ||
      g.gym_name.toLowerCase().includes(q) ||
      g.city?.toLowerCase().includes(q) ||
      g.location_address?.toLowerCase().includes(q),
  );

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
          <p className="text-gray-500 mt-1">Choose a gym to start tracking your climbs!</p>
        </div>

        <div className="relative w-full sm:w-80 shrink-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            className="w-full bg-white border border-gray-300 text-gray-900 placeholder-gray-400 rounded-full pl-10 pr-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow duration-200"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : !gyms || gyms.length === 0 ? (
        <p className="text-gray-500 text-sm">No gyms yet.</p>
      ) : matches.length === 0 ? (
        <p className="text-gray-500 text-sm">No gyms match "{query}".</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {matches.map((gym) => (
            <Link
              key={gym.id}
              to={`/gyms/${gym.slug}`}
              className="group relative h-[145px] sm:h-[220px] overflow-hidden rounded-2xl bg-gray-300 text-white"
            >
              {gym.cover_image_url ? (
                <img src={gym.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400" />
              )}

              <div className="absolute inset-0 bg-black/20 transition-colors duration-200 group-hover:bg-black/35" />

              <button
                type="button"
                onClick={(e) => handleToggleFavorite(e, gym.id)}
                disabled={favoriting === gym.id}
                title={homeGym?.id === gym.id ? 'Remove as home gym' : 'Set as home gym'}
                aria-label={homeGym?.id === gym.id ? 'Remove as home gym' : 'Set as home gym'}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    homeGym?.id === gym.id ? 'fill-amber-400 text-amber-400' : 'text-white'
                  }`}
                />
              </button>

              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-white shrink-0 flex items-center justify-center shadow-sm">
                  {gym.logo_url ? (
                    <img src={gym.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Mountain className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
                <h2 className="text-base sm:text-2xl font-semibold leading-tight drop-shadow-sm">{gym.gym_name}</h2>
                {gym.city && <p className="text-xs sm:text-lg sm:font-medium text-white/90 drop-shadow-sm">{gym.city}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
