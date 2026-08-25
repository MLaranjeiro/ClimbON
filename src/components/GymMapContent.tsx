import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { compareGrades, getGradeColorHex, getGradePinBorderHex } from '../lib/grades';
import { supabase } from '../lib/supabase';
import type { Gym, RouteGrade } from '../types';
import { GymMapViewer } from './GymMapViewer';
import { RouteDetailModal } from './RouteDetailModal';
import { WallDirectoryList } from './WallDirectoryList';

interface MapRoute {
  id: number;
  route_name: string;
  grade: RouteGrade;
  image_url: string | null;
  section_id: number | null;
  map_x: number | null;
  map_y: number | null;
  created_at: string;
}

interface MapSection {
  id: number;
  section_name: string;
}

export function GymMapContent({ gymId }: { gymId: number }) {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

  const { data: gym, isLoading: gymLoading } = useQuery({
    queryKey: ['gym', gymId],
    queryFn: async () => {
      const { data, error } = await supabase.from('gyms').select('*').eq('id', gymId).single();
      if (error) throw error;
      return data as Gym;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ['gym-sections-map', gymId],
    queryFn: async () => {
      const { data, error } = await supabase.from('sections').select('id, section_name').eq('gym_id', gymId);
      if (error) throw error;
      return data as MapSection[];
    },
  });

  const { data: routes } = useQuery({
    queryKey: ['gym-routes-map', gymId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('id, route_name, grade, image_url, section_id, map_x, map_y, created_at')
        .eq('gym_id', gymId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MapRoute[];
    },
  });

  const sectionList = sections ?? [];
  const routeList = useMemo(() => routes ?? [], [routes]);
  const placedRoutes = routeList.filter((r) => r.map_x != null && r.map_y != null);

  const selectedRoute = routeList.find((r) => r.id === selectedRouteId) ?? null;

  const siblingRoutes = useMemo(() => {
    if (!selectedRoute) return [];
    return routeList
      .filter((r) => r.section_id === selectedRoute.section_id)
      .sort((a, b) => {
        if (a.map_x != null && b.map_x != null) return a.map_x - b.map_x;
        if (a.map_x != null) return -1;
        if (b.map_x != null) return 1;
        return compareGrades(a.grade, b.grade);
      })
      .map((r) => ({ id: r.id, grade: r.grade }));
  }, [routeList, selectedRoute]);

  function openSection(sectionId: number | 'none') {
    const matches = routeList.filter((r) => (sectionId === 'none' ? r.section_id == null : r.section_id === sectionId));
    if (matches.length === 0) return;
    const lowest = [...matches].sort((a, b) => compareGrades(a.grade, b.grade))[0];
    setSelectedRouteId(lowest.id);
  }

  if (gymLoading) return <p className="text-gray-500 text-sm">Loading…</p>;
  if (!gym) return <p className="text-gray-500 text-sm">Gym not found.</p>;

  return (
    <div className="space-y-6">
      {gym.map_image_url ? (
        <GymMapViewer imageUrl={gym.map_image_url}>
          {placedRoutes.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedRouteId(r.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 shadow"
              style={{
                left: `${r.map_x}%`,
                top: `${r.map_y}%`,
                backgroundColor: getGradeColorHex(r.grade),
                borderColor: getGradePinBorderHex(r.grade),
              }}
              title={`${r.route_name} (${r.grade})`}
            />
          ))}
        </GymMapViewer>
      ) : (
        <div>
          <p className="text-gray-500 text-sm mb-4">This gym hasn't uploaded a map image yet — here's the wall directory instead.</p>
          <WallDirectoryList sections={sectionList} routes={routeList} onSelectSection={openSection} />
        </div>
      )}

      {selectedRouteId != null && (
        <RouteDetailModal
          routeId={selectedRouteId}
          siblingRoutes={siblingRoutes}
          onClose={() => setSelectedRouteId(null)}
          onNavigate={setSelectedRouteId}
        />
      )}
    </div>
  );
}
