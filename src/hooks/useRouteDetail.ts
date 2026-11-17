import { useQuery } from '@tanstack/react-query';
import { summarizeRatings } from '../lib/ratings';
import { supabase } from '../lib/supabase';
import type { RouteGrade, RouteStatus } from '../types';

export interface RouteDetailRow {
  id: number;
  route_name: string;
  grade: RouteGrade;
  status: RouteStatus;
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
          'id, route_name, grade, status, image_url, styles, gym_id, gym:gyms(gym_name), section:sections(section_name)',
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
      const [{ data: sendRows }, { data: ratings }] = await Promise.all([
        // A repeat send from the same user shouldn't inflate this count — dedupe to
        // distinct senders below instead of counting every logged entry.
        supabase.from('sends').select('user_id').eq('route_id', routeId!).neq('send_type', 'attempt'),
        supabase.from('difficulty_ratings').select('grade, quality').eq('route_id', routeId!),
      ]);
      const sendCount = new Set((sendRows ?? []).map((r) => r.user_id)).size;
      return { sendCount, ...summarizeRatings(ratings ?? []) };
    },
  });

  return { route, isLoading, beta, stats };
}
