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
        supabase.from('sends').select('route_id, user_id').in('route_id', routeIds).neq('send_type', 'attempt'),
        supabase.from('difficulty_ratings').select('route_id, grade').in('route_id', routeIds),
      ]);

      // A repeat send from the same user shouldn't inflate this count — dedupe to
      // distinct senders per route instead of counting every logged entry.
      const sendersByRoute = new Map<number, Set<string>>();
      for (const row of sendRows ?? []) {
        const senders = sendersByRoute.get(row.route_id) ?? new Set<string>();
        senders.add(row.user_id);
        sendersByRoute.set(row.route_id, senders);
      }
      const sendCounts = new Map<number, number>();
      for (const [routeId, senders] of sendersByRoute) {
        sendCounts.set(routeId, senders.size);
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
