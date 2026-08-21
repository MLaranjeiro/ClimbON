import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { WallDirectoryList } from '../components/WallDirectoryList';
import { supabase } from '../lib/supabase';
import type { Gym, RouteGrade, Section } from '../types';

interface MapRoute {
  id: number;
  route_name: string;
  grade: RouteGrade;
  image_url: string | null;
  section_id: number | null;
  created_at: string;
}

export function GymMap() {
  const { gymId } = useParams();
  const id = Number(gymId);

  const { data: gym, isLoading: gymLoading } = useQuery({
    queryKey: ['gym', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('gyms').select('*').eq('id', id).single();
      if (error) throw error;
      return data as Gym;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ['gym-sections', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('id, section_name, map_x, map_y, created_at')
        .eq('gym_id', id);
      if (error) throw error;
      return data as Section[];
    },
  });

  const { data: routes } = useQuery({
    queryKey: ['gym-routes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('id, route_name, grade, image_url, section_id, created_at')
        .eq('gym_id', id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MapRoute[];
    },
  });

  const sectionList = sections ?? [];
  const routeList = routes ?? [];
  const placed = sectionList.filter((s) => s.map_x != null && s.map_y != null);
  const unplaced = sectionList.filter((s) => s.map_x == null || s.map_y == null);

  function countFor(sectionId: number) {
    return routeList.filter((r) => r.section_id === sectionId).length;
  }

  if (gymLoading) return <p className="text-gray-500 text-sm">Loading…</p>;
  if (!gym) return <p className="text-gray-500 text-sm">Gym not found.</p>;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{gym.gym_name} — Gym Map</h1>
      </div>

      {gym.map_image_url ? (
        <>
          <div className="relative">
            <img src={gym.map_image_url} alt="" className="w-full rounded-xl border border-gray-200" />
            {placed.map((s) => (
              <Link
                key={s.id}
                to={`/routes/${id}/sections/${s.id}`}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
                style={{ left: `${s.map_x}%`, top: `${s.map_y}%` }}
              >
                <span className="badge bg-gray-900/85 text-white whitespace-nowrap">{s.section_name}</span>
                <span className="text-[10px] font-medium text-gray-700 bg-white/90 rounded-full px-1.5 py-0.5">
                  {countFor(s.id)} climbs
                </span>
              </Link>
            ))}
          </div>

          {unplaced.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Not shown on the map yet:</p>
              <div className="flex flex-wrap gap-2">
                {unplaced.map((s) => (
                  <Link key={s.id} to={`/routes/${id}/sections/${s.id}`} className="badge bg-gray-100 text-gray-700">
                    {s.section_name} · {countFor(s.id)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <section className="card-light">
          <p className="text-gray-500 text-sm mb-4">This gym hasn't uploaded a map image yet — here's the wall directory instead.</p>
          <WallDirectoryList gymId={id} sections={sectionList} routes={routeList} />
        </section>
      )}
    </div>
  );
}
