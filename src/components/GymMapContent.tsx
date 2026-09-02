import { Bookmark, Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useMyRouteStatuses } from '../hooks/useMyRouteStatuses';
import { compareGrades, getGradeColorHex, getGradePinBorderHex, getGradePinIconHex } from '../lib/grades';
import type { Gym } from '../types';
import { GymMapViewer } from './GymMapViewer';
import { RouteDetailModal } from './RouteDetailModal';
import { WallDirectoryList } from './WallDirectoryList';
import type { MapRoute, MapSection } from '../hooks/useGymMapData';

interface GymMapContentProps {
  gym: Gym;
  sections: MapSection[];
  routes: MapRoute[];
}

export function GymMapContent({ gym, sections, routes }: GymMapContentProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

  const placedRoutes = routes.filter((r) => r.map_x != null && r.map_y != null);
  const routeStatuses = useMyRouteStatuses(placedRoutes.map((r) => r.id));
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;

  const siblingRoutes = useMemo(() => {
    if (!selectedRoute) return [];
    return routes
      .filter((r) => r.section_id === selectedRoute.section_id)
      .sort((a, b) => {
        if (a.map_x != null && b.map_x != null) return a.map_x - b.map_x;
        if (a.map_x != null) return -1;
        if (b.map_x != null) return 1;
        return compareGrades(a.grade, b.grade);
      })
      .map((r) => ({ id: r.id, grade: r.grade }));
  }, [routes, selectedRoute]);

  function openSection(sectionId: number | 'none') {
    const matches = routes.filter((r) => (sectionId === 'none' ? r.section_id == null : r.section_id === sectionId));
    if (matches.length === 0) return;
    const lowest = [...matches].sort((a, b) => compareGrades(a.grade, b.grade))[0];
    setSelectedRouteId(lowest.id);
  }

  return (
    <div className="space-y-6">
      {gym.map_image_url ? (
        <GymMapViewer imageUrl={gym.map_image_url}>
          {placedRoutes.map((r) => {
            const status = routeStatuses.get(r.id);
            const iconColor = getGradePinIconHex(r.grade);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRouteId(r.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 shadow flex items-center justify-center"
                style={{
                  left: `${r.map_x}%`,
                  top: `${r.map_y}%`,
                  backgroundColor: getGradeColorHex(r.grade),
                  borderColor: getGradePinBorderHex(r.grade),
                }}
                title={`${r.route_name} (${r.grade})${status ? ` — ${status}` : ''}`}
              >
                {status === 'sent' && <Check className="w-2.5 h-2.5" style={{ color: iconColor }} strokeWidth={3} />}
                {status === 'attempted' && (
                  <Bookmark className="w-2.5 h-2.5" style={{ color: iconColor }} fill={iconColor} />
                )}
              </button>
            );
          })}
        </GymMapViewer>
      ) : (
        <div>
          <p className="text-gray-500 text-sm mb-4">This gym hasn't uploaded a map image yet — here's the wall directory instead.</p>
          <WallDirectoryList sections={sections} routes={routes} onSelectSection={openSection} />
        </div>
      )}

      {selectedRouteId != null && (
        <RouteDetailModal
          routeId={selectedRouteId}
          siblingRoutes={siblingRoutes}
          onClose={() => setSelectedRouteId(null)}
          onNavigate={setSelectedRouteId}
        />
      )}
    </div>
  );
}
