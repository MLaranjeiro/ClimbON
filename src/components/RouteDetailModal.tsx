import { CheckCircle, ChevronLeft, ChevronRight, MessageSquare, Mountain, X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from '../components/Avatar';
import { useRouteDetail } from '../hooks/useRouteDetail';
import { getGradeBadgeClasses, getGradeColorHex } from '../lib/grades';
import type { RouteGrade } from '../types';

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentIndex = siblingRoutes.findIndex((r) => r.id === routeId);
  const hasSiblings = siblingRoutes.length > 0 && currentIndex !== -1;

  function goTo(index: number) {
    const target = siblingRoutes[index];
    if (target) onNavigate(target.id);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            {hasSiblings && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {siblingRoutes.map((sibling, i) => (
                    <button
                      key={sibling.id}
                      type="button"
                      onClick={() => goTo(i)}
                      className={`w-5 h-5 rounded-full shrink-0 ${
                        i === currentIndex ? 'ring-2 ring-offset-1 ring-gray-900' : ''
                      }`}
                      style={{ backgroundColor: getGradeColorHex(sibling.grade) }}
                      title={sibling.grade}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => goTo(currentIndex + 1)}
                  disabled={currentIndex === siblingRoutes.length - 1}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-400 shrink-0">
                  {currentIndex + 1} / {siblingRoutes.length}
                </span>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="ml-auto p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5">
            {isLoading || !route ? (
              <p className="text-gray-500 text-sm">Loading…</p>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${getGradeBadgeClasses(route.grade)}`}>{route.grade}</span>
                    <h2 className="text-lg font-bold text-gray-900">{route.route_name}</h2>
                    {route.section && (
                      <span className="text-sm text-gray-400">on {route.section.section_name}</span>
                    )}
                  </div>
                </div>

                <div className="relative w-full h-64 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                  {route.image_url ? (
                    <img src={route.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Mountain className="w-10 h-10 text-gray-300" />
                  )}
                  <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-gray-900">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: getGradeColorHex(route.grade) }}
                    />
                    {route.grade}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">{route.grade}</div>
                    <div className="text-xs text-gray-500">Official grade</div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-3 text-center">
                    <div className="text-lg font-bold text-gray-900">
                      {stats?.avgDifficulty != null ? stats.avgDifficulty.toFixed(1) : '—'}
                    </div>
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

                {route.description && (
                  <p className="text-gray-900 whitespace-pre-line text-sm">{route.description}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4" />
                  {stats?.sendCount ?? 0} send{stats?.sendCount === 1 ? '' : 's'}
                </div>

                <section>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Beta</h3>
                  {!beta || beta.length === 0 ? (
                    <p className="text-gray-500 text-sm">No beta uploaded yet.</p>
                  ) : (
                    <ul className="space-y-4">
                      {beta.map((b) => (
                        <li key={b.id} className="flex gap-3">
                          <Avatar src={b.profile?.avatar_url} name={b.profile?.username} size={28} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                              {b.profile?.username ?? 'Unknown climber'}
                            </p>
                            {b.description_text && (
                              <p className="text-sm text-gray-700 mt-1">{b.description_text}</p>
                            )}
                            {b.video_url && (
                              <a
                                href={b.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand-600 text-xs hover:underline"
                              >
                                View video
                              </a>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Deferred: Holds photo-overlay toggle, rotation/set-history, community-grade distribution chart, favorites */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
