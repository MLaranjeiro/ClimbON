import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { getGradeBadgeClasses } from '../lib/grades';
import { supabase } from '../lib/supabase';
import type { RouteGrade, Section } from '../types';

interface SectionRoute {
  id: number;
  route_name: string;
  grade: RouteGrade;
  styles: string[];
  section_id: number | null;
}

interface SectionClimbsContentProps {
  gymId: number;
  sectionId: number | 'none';
  onSelectRoute: (routeId: number) => void;
}

export function SectionClimbsContent({ gymId, sectionId, onSelectRoute }: SectionClimbsContentProps) {
  const [query, setQuery] = useState('');

  const { data: sections } = useQuery({
    queryKey: ['gym-sections-for-section', gymId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('id, section_name, map_x, map_y, created_at')
        .eq('gym_id', gymId);
      if (error) throw error;
      return data as Section[];
    },
  });

  const { data: routes, isLoading } = useQuery({
    queryKey: ['gym-routes-for-section', gymId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('id, route_name, grade, styles, section_id')
        .eq('gym_id', gymId)
        .eq('status', 'active')
        .order('route_name');
      if (error) throw error;
      return data as SectionRoute[];
    },
  });

  const isUnsectioned = sectionId === 'none';
  const section = isUnsectioned ? null : (sections ?? []).find((s) => s.id === sectionId);
  const title = isUnsectioned ? 'Unsectioned climbs' : (section?.section_name ?? 'Section');

  const sectionRoutes = (routes ?? []).filter((r) => (isUnsectioned ? r.section_id == null : r.section_id === sectionId));

  const q = query.trim().toLowerCase();
  const visible = q
    ? sectionRoutes.filter(
        (r) => r.route_name.toLowerCase().includes(q) || r.styles.some((s) => s.toLowerCase().includes(q)),
      )
    : sectionRoutes;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-gray-500 mt-0.5 text-sm">
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
            <button
              key={route.id}
              type="button"
              onClick={() => onSelectRoute(route.id)}
              className="w-full flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 hover:border-gray-300 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`badge ${getGradeBadgeClasses(route.grade)}`}>{route.grade}</span>
                <span className="font-medium text-gray-900 truncate">{route.route_name}</span>
              </div>
              {route.styles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
                  {route.styles.slice(0, 3).map((style) => (
                    <span key={style} className="badge bg-gray-100 text-gray-600 text-xs">
                      {style}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
