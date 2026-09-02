import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/auth';
import { gradeFromRatingValue } from '../lib/grades';
import { supabase } from '../lib/supabase';
import type { SendType } from '../types';

export interface MyRouteLogEntry {
  send_type: SendType;
  date_completed: string;
  attempts: number;
  created_at: string;
}

export function myRouteLogKey(routeId: number, userId: string | undefined) {
  return ['my-send', routeId, userId];
}

// sends is a full session log now (many rows per user+route), so "logged" means any
// completed entry exists, not just any row — an attempt-only route isn't sent yet.
export function useMyRouteLog(routeId: number) {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: myRouteLogKey(routeId, user?.id),
    enabled: !!user,
    queryFn: async () => {
      const [{ data: sendRows }, { data: ratingRow }] = await Promise.all([
        supabase
          .from('sends')
          .select('send_type, date_completed, attempts, created_at')
          .eq('route_id', routeId)
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('difficulty_ratings')
          .select('grade, quality')
          .eq('route_id', routeId)
          .eq('user_id', user!.id)
          .maybeSingle(),
      ]);
      return { sends: (sendRows ?? []) as MyRouteLogEntry[], rating: ratingRow };
    },
  });

  const sends = data?.sends ?? [];
  const isLogged = sends.some((s) => s.send_type !== 'attempt');
  const hasAttempted = sends.length > 0;
  const latestSend = sends[0] ?? null;
  const loggedGrade = data?.rating?.grade != null ? gradeFromRatingValue(data.rating.grade) : null;
  const loggedQuality = data?.rating?.quality ?? null;

  return { sends, isLogged, hasAttempted, latestSend, loggedGrade, loggedQuality };
}
