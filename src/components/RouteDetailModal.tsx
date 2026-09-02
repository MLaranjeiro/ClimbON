import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  Mountain,
  Plus,
  PlusCircle,
  Star,
  Video,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMyRouteLog } from '../hooks/useMyRouteLog';
import { useRouteDetail } from '../hooks/useRouteDetail';
import { useSiblingRouteStats } from '../hooks/useSiblingRouteStats';
import { compareGrades, GRADE_SWATCH_BORDER, getGradeBadgeClasses, getGradeColorHex } from '../lib/grades';
import type { RouteGrade } from '../types';
import { BetaList } from './BetaList';
import { LogClimbForm } from './LogClimbForm';

interface SiblingRoute {
  id: number;
  grade: RouteGrade;
}

type SortColumn = 'grade' | 'difficulty' | 'sends';
type View = 'detail' | 'log';

interface RouteDetailModalProps {
  routeId: number;
  siblingRoutes: SiblingRoute[];
  onClose: () => void;
  onNavigate: (routeId: number) => void;
}

export function RouteDetailModal({ routeId, siblingRoutes, onClose, onNavigate }: RouteDetailModalProps) {
  const { route, isLoading, beta, stats } = useRouteDetail(routeId);
  const { isLogged } = useMyRouteLog(routeId);
  const [view, setView] = useState<View>('detail');
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const siblingIds = useMemo(() => siblingRoutes.map((r) => r.id), [siblingRoutes]);
  const { data: siblingStats } = useSiblingRouteStats(siblingIds);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (view === 'log') {
        setView('detail');
      } else {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, view]);

  const sortedSiblings = useMemo(() => {
    if (!sortColumn) return siblingRoutes;
    const direction = sortDirection === 'asc' ? 1 : -1;
    return [...siblingRoutes].sort((a, b) => {
      if (sortColumn === 'grade') return direction * compareGrades(a.grade, b.grade);

      if (sortColumn === 'sends') {
        const sendsA = siblingStats?.get(a.id)?.sendCount ?? 0;
        const sendsB = siblingStats?.get(b.id)?.sendCount ?? 0;
        return direction * (sendsA - sendsB);
      }

      // Difficulty rating — routes with no community ratings yet always sort to the end.
      const avgA = siblingStats?.get(a.id)?.avgDifficulty;
      const avgB = siblingStats?.get(b.id)?.avgDifficulty;
      if (avgA == null && avgB == null) return 0;
      if (avgA == null) return 1;
      if (avgB == null) return -1;
      return direction * (avgA - avgB);
    });
  }, [siblingRoutes, sortColumn, sortDirection, siblingStats]);

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection(column === 'grade' ? 'asc' : 'desc');
    }
  }

  const currentIndex = sortedSiblings.findIndex((r) => r.id === routeId);
  const hasSiblings = sortedSiblings.length > 0 && currentIndex !== -1;

  function goTo(index: number) {
    const target = sortedSiblings[index];
    if (target) onNavigate(target.id);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <div
          className={`w-full rounded-xl bg-white shadow-xl transition-[max-width] ${view === 'log' ? 'max-w-md' : 'max-w-2xl'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center border-b border-gray-100 px-4 py-3">
            {view === 'log' ? (
              <>
                <button
                  type="button"
                  onClick={() => setView('detail')}
                  className="shrink-0 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="flex-1 text-center text-lg font-bold text-gray-900 truncate px-2">Log Climb</h2>
              </>
            ) : (
              <>
                <div className="w-7 shrink-0" />
                <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
                  {hasSiblings && (
                    <>
                      <button
                        type="button"
                        onClick={() => goTo(currentIndex - 1)}
                        disabled={currentIndex === 0}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent shrink-0"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1.5 overflow-x-auto px-1 py-1 min-w-0">
                        {sortedSiblings.map((sibling, i) => (
                          <button
                            key={sibling.id}
                            type="button"
                            onClick={() => goTo(i)}
                            className={`badge shrink-0 border cursor-pointer ${getGradeBadgeClasses(sibling.grade)} ${
                              i === currentIndex ? 'ring-2 ring-offset-1 ring-gray-900' : ''
                            }`}
                            style={{ borderColor: GRADE_SWATCH_BORDER }}
                            title={sibling.grade}
                          >
                            {sibling.grade}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => goTo(currentIndex + 1)}
                        disabled={currentIndex === sortedSiblings.length - 1}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent shrink-0"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-gray-400 shrink-0">
                        {currentIndex + 1} / {sortedSiblings.length}
                      </span>
                    </>
                  )}
                </div>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {view === 'detail' && hasSiblings && (
            <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 text-xs">
              <span className="text-gray-400 font-medium shrink-0">Sort:</span>
              {(
                [
                  ['grade', 'Grade'],
                  ['difficulty', 'Rating'],
                  ['sends', 'Sends'],
                ] as const
              ).map(([column, label]) => (
                <button
                  key={column}
                  type="button"
                  onClick={() => toggleSort(column)}
                  className={`flex items-center gap-1 font-medium ${
                    sortColumn === column ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                  {sortColumn === column ? (
                    sortDirection === 'asc' ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )
                  ) : (
                    <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300" />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="p-5 max-h-[75vh] overflow-y-auto">
            {isLoading || !route ? (
              <p className="text-gray-500 text-sm">Loading…</p>
            ) : view === 'log' ? (
              <LogClimbForm
                routeId={route.id}
                routeName={route.route_name}
                grade={route.grade}
                sectionName={route.section?.section_name}
                onDone={() => setView('detail')}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`badge ${getGradeBadgeClasses(route.grade)}`}>{route.grade}</span>
                    <h2 className="text-lg font-bold text-gray-900 truncate">{route.route_name}</h2>
                    {route.section && (
                      <span className="text-sm text-gray-400 shrink-0">on {route.section.section_name}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setView('log')}
                    className={`text-sm flex items-center gap-2 shrink-0 ${isLogged ? 'btn-secondary-light' : 'btn-primary'}`}
                  >
                    {isLogged ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Logged
                        <Plus className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        Log Climb
                      </>
                    )}
                  </button>
                </div>

                <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                  {route.image_url ? (
                    <img src={route.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Mountain className="w-10 h-10 text-gray-300" />
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{route.grade}</div>
                    <div className="text-xs text-gray-500">Gym grade</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{stats?.communityGrade ?? '—'}</div>
                    <div className="text-xs text-gray-500">Community grade</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{stats?.sendCount ?? 0}</div>
                    <div className="text-xs text-gray-500">Sends</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <div className="text-lg font-bold text-gray-900 truncate">
                      {route.section?.section_name ?? '—'}
                    </div>
                    <div className="text-xs text-gray-500">Wall</div>
                  </div>
                </div>

                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Community grading
                  </h3>
                  <div className="rounded-lg border border-gray-200 p-4 min-h-[140px] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Senders
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">{stats?.communityGrade ?? '—'}</span>
                        <span className="text-sm text-gray-500">
                          {stats?.communityGrade
                            ? `avg ${stats.avgDifficulty!.toFixed(1)} · ${stats.ratingCount} send${stats.ratingCount === 1 ? '' : 's'}`
                            : 'No community grades yet'}
                        </span>
                      </div>

                      {/* Fixed height regardless of how many distinct grades are rated, so the
                          card never jitters when switching climbs. Empty state mirrors a real
                          row's shape rather than leaving blank space, so it reads as "no data"
                          instead of a layout gap. */}
                      <div className="mt-3 h-20 flex flex-col justify-center">
                        {stats && stats.ratingDistribution.length > 0 ? (
                          <div className="space-y-2 max-h-20 overflow-y-auto pr-1">
                            {stats.ratingDistribution.map((row) => {
                              const maxCount = Math.max(...stats.ratingDistribution.map((r) => r.count));
                              return (
                                <div key={row.grade} className="flex items-center gap-3">
                                  <span className="w-8 text-xs font-semibold text-gray-900 shrink-0">
                                    {row.grade}
                                  </span>
                                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                      className="h-full rounded-full border"
                                      style={{
                                        width: `${(row.count / maxCount) * 100}%`,
                                        backgroundColor: getGradeColorHex(row.grade),
                                        borderColor: GRADE_SWATCH_BORDER,
                                      }}
                                    />
                                  </div>
                                  <span className="w-4 text-xs text-gray-500 text-right shrink-0">{row.count}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 opacity-60">
                            <span className="w-8 text-xs font-semibold text-gray-400 shrink-0">—</span>
                            <div className="flex-1 h-2 rounded-full bg-gray-100" />
                            <span className="w-4 text-xs text-gray-400 text-right shrink-0">0</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        <Star className="w-3.5 h-3.5" />
                        Quality
                      </div>
                      <div className="flex items-baseline gap-2">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((n) => {
                            const filled = stats?.avgQuality != null && n <= Math.round(stats.avgQuality);
                            return (
                              <Star
                                key={n}
                                className={`w-4 h-4 ${filled ? 'text-amber-400' : 'text-gray-200'}`}
                                fill={filled ? 'currentColor' : 'none'}
                              />
                            );
                          })}
                        </div>
                        <span className="text-sm text-gray-500">
                          {stats?.avgQuality != null
                            ? `${stats.avgQuality.toFixed(1)} · ${stats.qualityCount} rating${stats.qualityCount === 1 ? '' : 's'}`
                            : 'No ratings yet'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Beta</h3>
                  {!beta || beta.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-gray-200 py-8 flex flex-col items-center justify-center gap-2 text-center">
                      <Video className="w-6 h-6 text-gray-400" />
                      <p className="text-gray-500 text-sm">No betas yet. Be the first to share one!</p>
                    </div>
                  ) : (
                    <BetaList beta={beta} />
                  )}
                </section>

                {/* Deferred: Holds photo-overlay toggle, rotation/set-history, favorites */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
