import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/auth';
import { supabase } from '../lib/supabase';

export type RouteLogStatus = 'sent' | 'attempted';

// Batched version of useMyRouteLog's isLogged/hasAttempted check — fetches the current
// user's log status for a whole set of routes (e.g. every pin on a gym map) in one
// round trip. A route with any completed entry is 'sent'; one with only attempt
// entries is 'attempted'; anything else is absent from the map.
export function useMyRouteStatuses(routeIds: number[]) {
  const { user } = useAuth();
  const key = [...routeIds].sort((a, b) => a - b).join(',');

  const { data } = useQuery({
    queryKey: ['my-route-statuses', key, user?.id],
    enabled: !!user && routeIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sends')
        .select('route_id, send_type')
        .eq('user_id', user!.id)
        .in('route_id', routeIds);
      if (error) throw error;

      const statuses = new Map<number, RouteLogStatus>();
      for (const row of data) {
        if (row.send_type !== 'attempt') statuses.set(row.route_id, 'sent');
      }
      for (const row of data) {
        if (row.send_type === 'attempt' && !statuses.has(row.route_id)) statuses.set(row.route_id, 'attempted');
      }
      return statuses;
    },
  });

  return data ?? new Map<number, RouteLogStatus>();
}
