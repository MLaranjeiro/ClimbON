import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { RouteRow } from '../components/RouteRow';
import { supabase } from '../lib/supabase';
import type { RouteGrade, Section } from '../types';

interface SectionRoute {
  id: number;
  route_name: string;
  grade: RouteGrade;
  styles: string[];
  section_id: number | null;
}

export function SectionClimbs() {
  const { gymId, sectionId } = useParams();
  const id = Number(gymId);
  const [query, setQuery] = useState('');

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

  const { data: routes, isLoading } = useQuery({
    queryKey: ['gym-routes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('id, route_name, grade, styles, section_id')
        .eq('gym_id', id)
        .eq('status', 'active')
        .order('route_name');
      if (error) throw error;
      return data as SectionRoute[];
    },
  });

  const isUnsectioned = sectionId === 'none';
  const section = isUnsectioned ? null : (sections ?? []).find((s) => s.id === Number(sectionId));
  const title = isUnsectioned ? 'Unsectioned climbs' : (section?.section_name ?? 'Section');

  const sectionRoutes = (routes ?? []).filter((r) =>
    isUnsectioned ? r.section_id == null : r.section_id === Number(sectionId),
  );

  const q = query.trim().toLowerCase();
  const visible = q
    ? sectionRoutes.filter(
        (r) => r.route_name.toLowerCase().includes(q) || r.styles.some((s) => s.toLowerCase().includes(q)),
      )
    : sectionRoutes;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500 mt-1">
          {sectionRoutes.length} climb{sectionRoutes.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          className="input-field-light pl-9"
          placeholder="Search climbs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : sectionRoutes.length === 0 ? (
        <p className="text-gray-500 text-sm">No climbs in this section yet.</p>
      ) : visible.length === 0 ? (
        <p className="text-gray-500 text-sm">No climbs match "{query}".</p>
      ) : (
        <div className="space-y-2">
          {visible.map((route) => (
            <RouteRow key={route.id} gymId={id} route={route} />
          ))}
        </div>
      )}
    </div>
  );
}
