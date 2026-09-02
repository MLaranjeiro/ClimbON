import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/auth';
import { supabase } from '../lib/supabase';

// Batched version of useMyRouteLog's "isLogged" check — fetches which of a set of
// routes (e.g. everything pinned on a gym map) the current user has already sent,
// in one round trip instead of one query per pin.
export function useMySentRouteIds(routeIds: number[]) {
  const { user } = useAuth();
  const key = [...routeIds].sort((a, b) => a - b).join(',');

  const { data } = useQuery({
    queryKey: ['my-sent-route-ids', key, user?.id],
    enabled: !!user && routeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sends')
        .select('route_id')
        .eq('user_id', user!.id)
        .in('route_id', routeIds);
      if (error) throw error;
      return new Set(data.map((row) => row.route_id));
    },
  });

  return data ?? new Set<number>();
}
