import { useMemo, useState } from 'react';
import type { RouteGrade } from '../types';
import type { MapRoute, MapSection } from './useGymMapData';

export function useGymMapFilter(routes: MapRoute[], sections: MapSection[]) {
  const [selectedGrades, setSelectedGrades] = useState<RouteGrade[]>([]);
  const hasGradeFilter = selectedGrades.length > 0;

  const filteredRoutes = useMemo(
    () => routes.filter((r) => !hasGradeFilter || selectedGrades.includes(r.grade)),
    [routes, hasGradeFilter, selectedGrades],
  );

  const filteredSections = useMemo(
    () => (hasGradeFilter ? sections.filter((s) => filteredRoutes.some((r) => r.section_id === s.id)) : sections),
    [hasGradeFilter, sections, filteredRoutes],
  );

  function toggleGrade(grade: RouteGrade) {
    setSelectedGrades((prev) => (prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]));
  }

  function reset() {
    setSelectedGrades([]);
  }

  return { selectedGrades, hasGradeFilter, filteredRoutes, filteredSections, toggleGrade, reset };
}
