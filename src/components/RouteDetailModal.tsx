import { CheckCircle, ChevronLeft, ChevronRight, Mountain, PlusCircle, Video, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouteDetail } from '../hooks/useRouteDetail';
import { GRADE_SWATCH_BORDER, getGradeBadgeClasses, getGradeColorHex } from '../lib/grades';
import type { RouteGrade } from '../types';
import { BetaList } from './BetaList';
import { LogClimbModal } from './LogClimbModal';

interface SiblingRoute {
  id: number;
  grade: RouteGrade;
}

interface RouteDetailModalProps {
  routeId: number;
  siblingRoutes: SiblingRoute[];
  onClose: () => void;
  onNavigate: (routeId: number) => void;
}

export function RouteDetailModal({ routeId, siblingRoutes, onClose, onNavigate }: RouteDetailModalProps) {
  const { route, isLoading, beta, stats } = useRouteDetail(routeId);
  const [showLogClimb, setShowLogClimb] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Let the Log Climb modal handle its own Escape while it's open on top of this one.
      if (showLogClimb) return;
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showLogClimb]);

  const currentIndex = siblingRoutes.findIndex((r) => r.id === routeId);
  const hasSiblings = siblingRoutes.length > 0 && currentIndex !== -1;

  function goTo(index: number) {
    const target = siblingRoutes[index];
    if (target) onNavigate(target.id);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40"
      onClick={() => {
        if (!showLogClimb) onClose();
      }}
    >
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center border-b border-gray-100 px-4 py-3">
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
                    {siblingRoutes.map((sibling, i) => (
                      <button
                        key={sibling.id}
                        type="button"
                        onClick={() => goTo(i)}
                        className={`w-5 h-5 rounded-full shrink-0 border ${
                          i === currentIndex ? 'ring-2 ring-offset-1 ring-gray-900' : ''
                        }`}
                        style={{ backgroundColor: getGradeColorHex(sibling.grade), borderColor: GRADE_SWATCH_BORDER }}
                        title={sibling.grade}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => goTo(currentIndex + 1)}
                    disabled={currentIndex === siblingRoutes.length - 1}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent shrink-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-400 shrink-0">
                    {currentIndex + 1} / {siblingRoutes.length}
                  </span>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            {isLoading || !route ? (
              <p className="text-gray-500 text-sm">Loading…</p>
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
                    onClick={() => setShowLogClimb(true)}
                    className="btn-primary text-sm flex items-center gap-2 shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Log Climb
                  </button>
                </div>

                <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
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
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Senders
                    </div>
                    {stats?.communityGrade ? (
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-gray-900">{stats.communityGrade}</span>
                        <span className="text-sm text-gray-500">
                          avg {stats.avgDifficulty!.toFixed(1)} · {stats.ratingCount} send
                          {stats.ratingCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mb-4">No community grades yet.</p>
                    )}

                    {stats && stats.ratingDistribution.length > 0 && (
                      <div className="space-y-2">
                        {stats.ratingDistribution.map((row) => {
                          const maxCount = Math.max(...stats.ratingDistribution.map((r) => r.count));
                          return (
                            <div key={row.grade} className="flex items-center gap-3">
                              <span className="w-8 text-xs font-semibold text-gray-900 shrink-0">{row.grade}</span>
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
                    )}
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

      {showLogClimb && route && (
        <LogClimbModal
          routeId={route.id}
          routeName={route.route_name}
          grade={route.grade}
          sectionName={route.section?.section_name}
          onClose={() => setShowLogClimb(false)}
        />
      )}
    </div>,
    document.body,
  );
}
