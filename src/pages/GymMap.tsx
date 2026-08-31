import { useParams } from 'react-router-dom';
import { GymMapContent } from '../components/GymMapContent';
import { GymMapFilterBar } from '../components/GymMapFilterBar';
import { useGymBySlug } from '../hooks/useGymBySlug';
import { useGymMapData } from '../hooks/useGymMapData';
import { useGymMapFilter } from '../hooks/useGymMapFilter';

export function GymMap() {
  const { gymSlug } = useParams();
  const { data: gymSummary, isLoading: slugLoading } = useGymBySlug(gymSlug);
  const { gym, gymLoading, sections, routes } = useGymMapData(gymSummary?.id);
  const { selectedGrades, filteredRoutes, filteredSections, toggleGrade, reset } = useGymMapFilter(routes, sections);

  if (slugLoading || gymLoading) return <p className="text-gray-500 text-sm">Loading…</p>;
  if (!gym) return <p className="text-gray-500 text-sm">Gym not found.</p>;

  const totalPlacedCount = routes.filter((r) => r.map_x != null && r.map_y != null).length;
  const shownPlacedCount = filteredRoutes.filter((r) => r.map_x != null && r.map_y != null).length;
  const showCount = Boolean(gym.map_image_url);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{gym.gym_name} — Gym Map</h1>
      </div>

      <GymMapFilterBar
        selectedGrades={selectedGrades}
        onToggleGrade={toggleGrade}
        onReset={reset}
        shownCount={showCount ? shownPlacedCount : undefined}
        totalCount={showCount ? totalPlacedCount : undefined}
      />

      <GymMapContent gym={gym} sections={filteredSections} routes={filteredRoutes} />
    </div>
  );
}
