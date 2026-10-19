import { ArrowDownWideNarrow, ArrowUpNarrowWide, CheckCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSiblingRouteStats } from '../hooks/useSiblingRouteStats';
import { getGradeBadgeClasses } from '../lib/grades';
import { ROUTE_SORT_OPTIONS, sortRoutes, type RouteSortKey, type SortDirection } from '../lib/routeSort';
import type { RouteGrade } from '../types';

interface ListRoute {
  id: number;
  route_name: string;
  grade: RouteGrade;
  styles: string[];
  section_id: number | null;
}

interface RouteListViewProps {
  routes: ListRoute[];
  sections: { id: number; section_name: string }[];
  onSelectRoute: (routeId: number, orderedRoutes: { id: number; grade: RouteGrade }[]) => void;
}

export function RouteListView({ routes, sections, onSelectRoute }: RouteListViewProps) {
  const [sortKey, setSortKey] = useState<RouteSortKey>('grade');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { data: stats, isLoading: statsLoading } = useSiblingRouteStats(routes.map((r) => r.id));

  const sectionNames = useMemo(() => new Map(sections.map((s) => [s.id, s.section_name])), [sections]);

  const sorted = useMemo(
    () =>
      sortRoutes(
        routes.map((r) => ({
          ...r,
          avgDifficulty: stats?.get(r.id)?.avgDifficulty ?? null,
          sendCount: stats?.get(r.id)?.sendCount ?? 0,
        })),
        sortKey,
        sortDirection,
      ),
    [routes, stats, sortKey, sortDirection],
  );

  const ordered = sorted.map((r) => ({ id: r.id, grade: r.grade }));
  const sortingByStats = sortKey !== 'grade' && statsLoading;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <label htmlFor="route-sort" className="text-sm text-gray-600">
          Sort by
        </label>
        <select
          id="route-sort"
          className="input-field-light w-auto py-1.5 text-sm"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as RouteSortKey)}
        >
          {ROUTE_SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
          className="btn-secondary-light text-sm py-1.5 px-3 flex items-center gap-1.5"
          aria-label={`Sort direction: ${sortDirection === 'asc' ? 'Low to high' : 'High to low'}`}
        >
          {sortDirection === 'asc' ? (
            <ArrowUpNarrowWide className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ArrowDownWideNarrow className="w-4 h-4" aria-hidden="true" />
          )}
          {sortDirection === 'asc' ? 'Low to high' : 'High to low'}
        </button>
        {sortingByStats && <span className="text-xs text-gray-500">Loading stats…</span>}
      </div>

      <ul className="space-y-2" aria-label="Climbs">
        {sorted.map((route) => (
          <li key={route.id}>
            <button
              type="button"
              onClick={() => onSelectRoute(route.id, ordered)}
              className="w-full flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 hover:border-gray-300 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`badge ${getGradeBadgeClasses(route.grade)}`}>{route.grade}</span>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{route.route_name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {route.section_id != null ? (sectionNames.get(route.section_id) ?? 'Wall') : 'Unsectioned'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-4 text-xs text-gray-600 shrink-0">
                <span>
                  {route.avgDifficulty != null ? `Avg. difficulty ${route.avgDifficulty.toFixed(1)}` : 'Not rated'}
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  {route.sendCount} send{route.sendCount === 1 ? '' : 's'}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
