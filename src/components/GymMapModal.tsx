import { useGymMapData } from '../hooks/useGymMapData';
import { useGymMapFilter } from '../hooks/useGymMapFilter';
import { GymMapContent } from './GymMapContent';
import { GymMapFilterBar } from './GymMapFilterBar';
import { ModalShell } from './ModalShell';

export function GymMapModal({ gymId, onClose }: { gymId: number; onClose: () => void }) {
  const { gym, gymLoading, sections, routes } = useGymMapData(gymId);
  const { selectedGrades, filteredRoutes, filteredSections, toggleGrade, reset } = useGymMapFilter(routes, sections);

  const totalPlacedCount = routes.filter((r) => r.map_x != null && r.map_y != null).length;
  const shownPlacedCount = filteredRoutes.filter((r) => r.map_x != null && r.map_y != null).length;
  const showCount = Boolean(gym?.map_image_url);

  return (
    <ModalShell
      onClose={onClose}
      maxWidthClass="max-w-7xl"
      headerExtra={
        <GymMapFilterBar
          selectedGrades={selectedGrades}
          onToggleGrade={toggleGrade}
          onReset={reset}
          shownCount={showCount ? shownPlacedCount : undefined}
          totalCount={showCount ? totalPlacedCount : undefined}
        />
      }
    >
      {gymLoading ? (
        <p className="text-gray-500 text-sm">Loading…</p>
      ) : !gym ? (
        <p className="text-gray-500 text-sm">Gym not found.</p>
      ) : (
        <GymMapContent gym={gym} sections={filteredSections} routes={filteredRoutes} />
      )}
    </ModalShell>
  );
}
