import { compareGrades } from './grades';
import type { RouteGrade } from '../types';

export type RouteSortKey = 'grade' | 'difficulty' | 'sends';
export type SortDirection = 'asc' | 'desc';

export const ROUTE_SORT_OPTIONS: { key: RouteSortKey; label: string }[] = [
  { key: 'grade', label: 'Grade' },
  { key: 'difficulty', label: 'Avg. difficulty rating' },
  { key: 'sends', label: 'Number of sends' },
];

export interface SortableRoute {
  route_name: string;
  grade: RouteGrade;
  avgDifficulty: number | null;
  sendCount: number;
}

// Unrated routes have no difficulty to compare, so they always sink to the bottom
// rather than flipping to the top when the direction is reversed. Ties fall back to
// route name so the list order is stable between renders.
export function sortRoutes<T extends SortableRoute>(routes: T[], key: RouteSortKey, direction: SortDirection): T[] {
  const sign = direction === 'asc' ? 1 : -1;

  return [...routes].sort((a, b) => {
    let diff = 0;
    if (key === 'grade') {
      diff = sign * compareGrades(a.grade, b.grade);
    } else if (key === 'sends') {
      diff = sign * (a.sendCount - b.sendCount);
    } else {
      if (a.avgDifficulty == null && b.avgDifficulty == null) diff = 0;
      else if (a.avgDifficulty == null) return 1;
      else if (b.avgDifficulty == null) return -1;
      else diff = sign * (a.avgDifficulty - b.avgDifficulty);
    }
    return diff !== 0 ? diff : a.route_name.localeCompare(b.route_name);
  });
}
