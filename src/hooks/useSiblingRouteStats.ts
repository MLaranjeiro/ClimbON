import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface RouteStatsSummary {
  avgDifficulty: number | null;
  sendCount: number;
}

// Batched version of the per-route stats in useRouteDetail — fetches send counts and
// average difficulty for a whole set of routes (e.g. one wall) in two queries instead
// of one round trip per route.
export function useSiblingRouteStats(routeIds: number[]) {
  const key = [...routeIds].sort((a, b) => a - b).join(',');

  return useQuery({
    queryKey: ['sibling-route-stats', key],
    enabled: routeIds.length > 0,
    queryFn: async () => {
      const [{ data: sendRows }, { data: ratingRows }] = await Promise.all([
        supabase.from('sends').select('route_id').in('route_id', routeIds).neq('send_type', 'attempt'),
        supabase.from('difficulty_ratings').select('route_id, grade').in('route_id', routeIds),
      ]);

      const sendCounts = new Map<number, number>();
      for (const row of sendRows ?? []) {
        sendCounts.set(row.route_id, (sendCounts.get(row.route_id) ?? 0) + 1);
      }

      const ratingTotals = new Map<number, { sum: number; count: number }>();
      for (const row of ratingRows ?? []) {
        const entry = ratingTotals.get(row.route_id) ?? { sum: 0, count: 0 };
        entry.sum += row.grade;
        entry.count += 1;
        ratingTotals.set(row.route_id, entry);
      }

      const stats = new Map<number, RouteStatsSummary>();
      for (const id of routeIds) {
        const rating = ratingTotals.get(id);
        stats.set(id, {
          avgDifficulty: rating ? rating.sum / rating.count : null,
          sendCount: sendCounts.get(id) ?? 0,
        });
      }
      return stats;
    },
  });
}
