import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { RouteGrade, RouteStatus } from '../types';

export interface RouteDetailRow {
  id: number;
  route_name: string;
  grade: RouteGrade;
  status: RouteStatus;
  description: string | null;
  image_url: string | null;
  styles: string[];
  gym_id: number;
  gym: { gym_name: string } | null;
  section: { section_name: string } | null;
}

export interface BetaRow {
  id: number;
  description_text: string | null;
  video_url: string | null;
  created_at: string;
  profile: { username: string; avatar_url: string | null } | null;
}

export function useRouteDetail(routeId: number | null) {
  const { data: route, isLoading } = useQuery({
    queryKey: ['route', routeId],
    enabled: routeId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select(
          'id, route_name, grade, status, description, image_url, styles, gym_id, gym:gyms(gym_name), section:sections(section_name)',
        )
        .eq('id', routeId!)
        .single();
      if (error) throw error;
      return data as unknown as RouteDetailRow;
    },
  });

  const { data: beta } = useQuery({
    queryKey: ['route-beta', routeId],
    enabled: routeId != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beta')
        .select('id, description_text, video_url, created_at, profile:profiles(username, avatar_url)')
        .eq('route_id', routeId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as BetaRow[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['route-stats', routeId],
    enabled: routeId != null,
    queryFn: async () => {
      const [{ count: sendCount }, { data: ratings }] = await Promise.all([
        supabase.from('sends').select('id', { count: 'exact', head: true }).eq('route_id', routeId!),
        supabase.from('difficulty_ratings').select('grade').eq('route_id', routeId!),
      ]);
      const avg =
        ratings && ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.grade, 0) / ratings.length : null;
      return { sendCount: sendCount ?? 0, avgDifficulty: avg };
    },
  });

  return { route, isLoading, beta, stats };
}
