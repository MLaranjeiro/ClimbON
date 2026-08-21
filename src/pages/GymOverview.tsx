import { useQuery } from '@tanstack/react-query';
import { Info, Map as MapIcon, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer } from 'recharts';
import { RouteRow } from '../components/RouteRow';
import { WallDirectoryList } from '../components/WallDirectoryList';
import { GRADE_ORDER, getGradeColorHex } from '../lib/grades';
import { supabase } from '../lib/supabase';
import type { Gym, RouteGrade, Section } from '../types';

interface OverviewRoute {
  id: number;
  route_name: string;
  grade: RouteGrade;
  styles: string[];
  image_url: string | null;
  section_id: number | null;
  created_at: string;
}

function isWithinDays(dateStr: string, days: number) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

function daysAgo(dateStr: string) {
  return Math.max(0, Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000));
}

export function GymOverview() {
  const { gymId } = useParams();
  const id = Number(gymId);
  const [query, setQuery] = useState('');

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

  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['gym-routes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('id, route_name, grade, styles, image_url, section_id, created_at')
        .eq('gym_id', id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OverviewRoute[];
    },
  });

  const sectionList = sections ?? [];
  const routeList = routes ?? [];

  const wallsCount = sectionList.length;
  const climbsCount = routeList.length;
  const setThisWeek = routeList.filter((r) => isWithinDays(r.created_at, 7)).length;

  const gradeMix = GRADE_ORDER.map((grade) => ({
    grade,
    count: routeList.filter((r) => r.grade === grade).length,
  })).filter((row) => row.count > 0);

  const freshSections = sectionList
    .map((s) => {
      const latest = routeList
        .filter((r) => r.section_id === s.id && isWithinDays(r.created_at, 14))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      return latest ? { section: s, latestCreatedAt: latest.created_at } : null;
    })
    .filter((x): x is { section: Section; latestCreatedAt: string } => x !== null)
    .sort((a, b) => b.latestCreatedAt.localeCompare(a.latestCreatedAt))
    .slice(0, 5);

  const q = query.trim().toLowerCase();
  const searchMatches = q
    ? routeList.filter(
        (r) => r.route_name.toLowerCase().includes(q) || r.styles.some((s) => s.toLowerCase().includes(q)),
      )
    : [];

  if (gymLoading) {
    return <p className="text-gray-500 text-sm">Loading…</p>;
  }

  if (!gym) {
    return <p className="text-gray-500 text-sm">Gym not found.</p>;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-brand-100 flex items-center justify-center shrink-0">
          {gym.logo_url ? (
            <img src={gym.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-brand-700">{gym.gym_name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{gym.gym_name}</h1>
          {gym.location_address && <p className="text-gray-500 mt-0.5">{gym.location_address}</p>}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-10 gap-y-3">
        <div>
          <p className="text-xs text-gray-500">Walls</p>
          <p className="text-xl font-bold text-gray-900">{wallsCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Climbs</p>
          <p className="text-xl font-bold text-gray-900">{climbsCount}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Set this week</p>
          <p className="text-xl font-bold text-gray-900">{setThisWeek}</p>
        </div>
        {gradeMix.length > 0 && (
          <div className="flex-1 min-w-[160px] max-w-xs">
            <p className="text-xs text-gray-500 mb-1">Grade mix</p>
            <ResponsiveContainer width="100%" height={36}>
              <BarChart data={gradeMix}>
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {gradeMix.map((row) => (
                    <Cell key={row.grade} fill={getGradeColorHex(row.grade)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <Link to={`/routes/${id}/about`} className="btn-secondary-light text-sm flex items-center gap-2">
          <Info className="w-4 h-4" />
          Info
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="input-field-light pl-9"
            placeholder="Search climbs and walls"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Link to={`/routes/${id}/map`} className="btn-primary text-sm flex items-center gap-2 shrink-0">
          <MapIcon className="w-4 h-4" />
          Gym Map
        </Link>
      </div>

      {q ? (
        <section className="card-light">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Search results</h2>
          {searchMatches.length === 0 ? (
            <p className="text-gray-500 text-sm">No climbs match "{query}".</p>
          ) : (
            <div className="space-y-2">
              {searchMatches.map((route) => (
                <RouteRow key={route.id} gymId={id} route={route} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {freshSections.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Fresh sets</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {freshSections.map(({ section, latestCreatedAt }) => (
                  <Link
                    key={section.id}
                    to={`/routes/${id}/sections/${section.id}`}
                    className="card-light hover:border-gray-300 transition-colors"
                  >
                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                      New · {daysAgo(latestCreatedAt)}d ago
                    </p>
                    <p className="font-semibold text-gray-900 mt-1">{section.section_name}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="card-light">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Wall directory</h2>
            {routesLoading ? (
              <p className="text-gray-500 text-sm">Loading…</p>
            ) : (
              <WallDirectoryList gymId={id} sections={sectionList} routes={routeList} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
