import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/auth';
import { gradeFromRatingValue } from '../lib/grades';
import { supabase } from '../lib/supabase';

export function myRouteLogKey(routeId: number, userId: string | undefined) {
  return ['my-send', routeId, userId];
}

export function useMyRouteLog(routeId: number) {
  const { user } = useAuth();

  const { data: existing } = useQuery({
    queryKey: myRouteLogKey(routeId, user?.id),
    enabled: !!user,
    queryFn: async () => {
      const [{ data: sendRow }, { data: ratingRow }] = await Promise.all([
        supabase
          .from('sends')
          .select('date_completed')
          .eq('route_id', routeId)
          .eq('user_id', user!.id)
          .maybeSingle(),
        supabase
          .from('difficulty_ratings')
          .select('grade')
          .eq('route_id', routeId)
          .eq('user_id', user!.id)
          .maybeSingle(),
      ]);
      return { send: sendRow, rating: ratingRow };
    },
  });

  const isLogged = !!existing?.send;
  const loggedGrade = existing?.rating?.grade != null ? gradeFromRatingValue(existing.rating.grade) : null;

  return { existing, isLogged, loggedGrade };
}
