import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Gym, RouteGrade } from '../types';

export interface MapRoute {
  id: number;
  route_name: string;
  grade: RouteGrade;
  image_url: string | null;
  section_id: number | null;
  map_x: number | null;
  map_y: number | null;
  created_at: string;
}

export interface MapSection {
  id: number;
  section_name: string;
}

export function useGymMapData(gymId: number | undefined) {
  const { data: gym, isLoading: gymLoading } = useQuery({
    queryKey: ['gym', gymId],
    enabled: gymId != null,
    queryFn: async () => {
      const { data, error } = await supabase.from('gyms').select('*').eq('id', gymId!).single();
      if (error) throw error;
      return data as Gym;
    },
  });

  const { data: sections } = useQuery({
    queryKey: ['gym-sections-map', gymId],
    enabled: gymId != null,
    queryFn: async () => {
      const { data, error } = await supabase.from('sections').select('id, section_name').eq('gym_id', gymId!);
      if (error) throw error;
      return data as MapSection[];
    },
  });

  const { data: routes } = useQuery({
    queryKey: ['gym-routes-map', gymId],
    enabled: gymId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('id, route_name, grade, image_url, section_id, map_x, map_y, created_at')
        .eq('gym_id', gymId!)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MapRoute[];
    },
  });

  return { gym, gymLoading, sections: sections ?? [], routes: routes ?? [] };
}
