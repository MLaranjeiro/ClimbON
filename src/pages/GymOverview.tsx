import { useQuery } from '@tanstack/react-query';
import { Info, ListFilter, Map as MapIcon, Search, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Bar, BarChart, Cell, ResponsiveContainer } from 'recharts';
import { GradeBreakdownModal } from '../components/GradeBreakdownModal';
import { GymMapModal } from '../components/GymMapModal';
import { InfoModal } from '../components/InfoModal';
import { RouteDetailModal } from '../components/RouteDetailModal';
import { RouteFiltersPanel } from '../components/RouteFiltersPanel';
import { WallDirectoryList } from '../components/WallDirectoryList';
import { useGymBySlug } from '../hooks/useGymBySlug';
import { compareGrades, GRADE_ORDER, GRADE_SWATCH_BORDER, getGradeColorHex } from '../lib/grades';
import { supabase } from '../lib/supabase';
import type { RouteGrade, Section } from '../types';

interface OverviewRoute {
  id: number;
  route_name: string;
  grade: RouteGrade;
  styles: string[];
  image_url: string | null;
  section_id: number | null;
  created_at: string;
}

function isWithinDays(dateStr: string, days: number) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

function daysAgo(dateStr: string) {
  return Math.max(0, Math.round((Date.now() - new Date(dateStr).getTime()) / 86400000));
}

export function GymOverview() {
  const { gymSlug } = useParams();
  const [query, setQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showGradeBreakdown, setShowGradeBreakdown] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [siblingRoutes, setSiblingRoutes] = useState<{ id: number; grade: RouteGrade }[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<RouteGrade[]>([]);
  const [selectedSectionIds, setSelectedSectionIds] = useState<(number | 'none')[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: gym, isLoading: gymLoading } = useGymBySlug(gymSlug);
  const id = gym?.id;

  const { data: sections } = useQuery({
    queryKey: ['gym-sections-overview', id],
    enabled: id != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('id, section_name, map_x, map_y, created_at')
        .eq('gym_id', id!);
      if (error) throw error;
      return data as Section[];
    },
  });

  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ['gym-routes-overview', id],
    enabled: id != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('id, route_name, grade, styles, image_url, section_id, created_at')
        .eq('gym_id', id!)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as OverviewRoute[];
    },
  });

  const sectionList = sections ?? [];
  const routeList = routes ?? [];

  const wallsCount = sectionList.length;
  const climbsCount = routeList.length;
  const setThisWeek = routeList.filter((r) => isWithinDays(r.created_at, 7)).length;

  const fullGradeMix = GRADE_ORDER.map((grade) => ({
    grade,
    count: routeList.filter((r) => r.grade === grade).length,
  }));
  const gradeMix = fullGradeMix.filter((row) => row.count > 0);

  const freshSections = sectionList
    .map((s) => {
      const latest = routeList
        .filter((r) => r.section_id === s.id && isWithinDays(r.created_at, 14))
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      return latest ? { section: s, latestCreatedAt: latest.created_at } : null;
    })
    .filter((x): x is { section: Section; latestCreatedAt: string } => x !== null)
    .sort((a, b) => b.latestCreatedAt.localeCompare(a.latestCreatedAt))
    .slice(0, 5);

  const q = query.trim().toLowerCase();
  const hasGradeFilter = selectedGrades.length > 0;
  const hasWallFilter = selectedSectionIds.length > 0;

  function routeMatchesGrade(r: OverviewRoute) {
    return !hasGradeFilter || selectedGrades.includes(r.grade);
  }
  function routeMatchesText(r: OverviewRoute) {
    return !q || r.route_name.toLowerCase().includes(q) || r.styles.some((s) => s.toLowerCase().includes(q));
  }
  function routeMatchesSearch(r: OverviewRoute) {
    return routeMatchesText(r) && routeMatchesGrade(r);
  }

  // Grade filter narrows which climbs count/appear per wall card; a text-search match still
  // shows the wall's full picture (matches the "find this wall" intent rather than "only show this").
  const directoryRoutesBase = hasGradeFilter ? routeList.filter(routeMatchesGrade) : routeList;

  const filteredSections = sectionList.filter((s) => {
    if (hasWallFilter && !selectedSectionIds.includes(s.id)) return false;
    if (!q && !hasGradeFilter) return true;
    const nameMatches = !hasGradeFilter && s.section_name.toLowerCase().includes(q);
    const hasMatchingRoute = routeList.some((r) => r.section_id === s.id && routeMatchesSearch(r));
    return nameMatches || hasMatchingRoute;
  });

  const unsectionedRoutes = routeList.filter((r) => r.section_id == null);
  const unsectionedAllowedByWallFilter = !hasWallFilter || selectedSectionIds.includes('none');
  const includeUnsectioned =
    unsectionedAllowedByWallFilter && (!q && !hasGradeFilter ? true : unsectionedRoutes.some(routeMatchesSearch));
  const directoryRoutes = includeUnsectioned
    ? directoryRoutesBase
    : directoryRoutesBase.filter((r) => r.section_id != null);

  const wallOptions = [
    ...sectionList.map((s) => ({
      id: s.id as number | 'none',
      name: s.section_name,
      count: routeList.filter((r) => r.section_id === s.id && routeMatchesGrade(r)).length,
    })),
    ...(unsectionedRoutes.length > 0
      ? [{ id: 'none' as const, name: 'Unsectioned', count: unsectionedRoutes.filter(routeMatchesGrade).length }]
      : []),
  ];

  const totalMatchingClimbs = routeList.filter((r) => {
    if (hasWallFilter) {
      const inWall = r.section_id == null ? selectedSectionIds.includes('none') : selectedSectionIds.includes(r.section_id);
      if (!inWall) return false;
    }
    return routeMatchesSearch(r);
  }).length;

  function toggleGrade(grade: RouteGrade) {
    setSelectedGrades((prev) => (prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]));
  }
  function toggleSection(id: number | 'none') {
    setSelectedSectionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function resetFilters() {
    setSelectedGrades([]);
    setSelectedSectionIds([]);
  }

  const activeFilterCount = selectedGrades.length + selectedSectionIds.length;

  function openSection(sectionId: number | 'none') {
    const matches = routeList
      .filter((r) => (sectionId === 'none' ? r.section_id == null : r.section_id === sectionId))
      .sort((a, b) => compareGrades(a.grade, b.grade))
      .map((r) => ({ id: r.id, grade: r.grade }));
    if (matches.length === 0) return;
    setSiblingRoutes(matches);
    setSelectedRouteId(matches[0].id);
  }

  if (gymLoading) {
    return <p className="text-gray-500 text-sm">Loading…</p>;
  }

  if (!gym) {
    return <p className="text-gray-500 text-sm">Gym not found.</p>;
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center gap-6 flex-wrap pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4 shrink-0">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-brand-100 flex items-center justify-center shrink-0">
            {gym.logo_url ? (
              <img src={gym.logo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-brand-700">{gym.gym_name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{gym.gym_name}</h1>
            {gym.location_address && <p className="text-gray-500 mt-0.5 text-sm">{gym.location_address}</p>}
          </div>
        </div>

        <div className="hidden sm:block w-px h-10 bg-gray-200 shrink-0" />

        <div className="flex items-center gap-10 flex-1 justify-start flex-wrap">
          <div>
            <p className="text-xl font-bold text-gray-900">{wallsCount}</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Walls</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{climbsCount}</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Climbs</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{setThisWeek}</p>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Set this week</p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {gradeMix.length > 0 && (
            <button
              type="button"
              onClick={() => setShowGradeBreakdown(true)}
              className="w-40 shrink-0 rounded-lg -m-2 p-2 hover:bg-gray-50 transition-colors"
              title="View grade breakdown"
            >
              <div className="pointer-events-none">
                <ResponsiveContainer width="100%" height={44}>
                  <BarChart data={gradeMix}>
                    <Bar dataKey="count" radius={[4, 4, 4, 4]}>
                      {gradeMix.map((row) => (
                        <Cell key={row.grade} fill={getGradeColorHex(row.grade)} stroke={GRADE_SWATCH_BORDER} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide text-center mt-1">
                Grade mix · {gradeMix[0].grade}–{gradeMix[gradeMix.length - 1].grade}
              </p>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowMap(true)} className="btn-primary text-sm flex items-center gap-2">
              <MapIcon className="w-4 h-4" />
              Gym Map
            </button>
            <button type="button" onClick={() => setShowInfo(true)} className="btn-secondary-light text-sm flex items-center gap-2">
              <Info className="w-4 h-4" />
              Info
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="input-field-light pl-9"
            placeholder="Search climbs and walls"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {showFilters && <div className="fixed inset-0 z-10 bg-black/10" onClick={() => setShowFilters(false)} />}

        <div className="relative z-20 shrink-0" ref={filtersRef}>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="btn-secondary-light text-sm flex items-center gap-2"
          >
            <ListFilter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
          {showFilters && (
            <RouteFiltersPanel
              wallOptions={wallOptions}
              selectedGrades={selectedGrades}
              onToggleGrade={toggleGrade}
              selectedSectionIds={selectedSectionIds}
              onToggleSection={toggleSection}
              onReset={resetFilters}
              matchCount={totalMatchingClimbs}
            />
          )}
        </div>

        {freshSections.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap ml-auto">
            <span className="flex items-center gap-1 text-xs font-semibold text-green-700 uppercase tracking-wide shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              Fresh sets
            </span>
            {freshSections.map(({ section, latestCreatedAt }) => (
              <button
                key={section.id}
                type="button"
                onClick={() => openSection(section.id)}
                className="badge bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                {section.section_name} · {daysAgo(latestCreatedAt)}d
              </button>
            ))}
          </div>
        )}
      </div>

      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Wall directory</h2>
        {routesLoading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : filteredSections.length === 0 && !includeUnsectioned ? (
          <p className="text-gray-500 text-sm">
            {q ? `No climbs or walls match "${query}".` : 'No climbs match the selected filters.'}
          </p>
        ) : (
          <WallDirectoryList sections={filteredSections} routes={directoryRoutes} onSelectSection={openSection} />
        )}
      </section>

      {showMap && <GymMapModal gymId={gym.id} onClose={() => setShowMap(false)} />}
      {showInfo && <InfoModal gymId={gym.id} onClose={() => setShowInfo(false)} />}
      {selectedRouteId != null && (
        <RouteDetailModal
          routeId={selectedRouteId}
          siblingRoutes={siblingRoutes}
          onClose={() => setSelectedRouteId(null)}
          onNavigate={setSelectedRouteId}
        />
      )}
      {showGradeBreakdown && (
        <GradeBreakdownModal
          gradeMix={fullGradeMix}
          totalClimbs={climbsCount}
          onClose={() => setShowGradeBreakdown(false)}
        />
      )}
    </div>
  );
}
