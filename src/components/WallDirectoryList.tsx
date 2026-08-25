import { compareGrades } from '../lib/grades';
import type { RouteGrade } from '../types';

interface DirectoryRoute {
  id: number;
  route_name: string;
  grade: RouteGrade;
  image_url: string | null;
  section_id: number | null;
  created_at: string;
}

interface WallDirectoryListProps {
  sections: { id: number; section_name: string }[];
  routes: DirectoryRoute[];
  onSelectSection: (sectionId: number | 'none') => void;
}

interface WallEntry {
  id: number | 'none';
  name: string;
  count: number;
  minGrade: RouteGrade | null;
  maxGrade: RouteGrade | null;
  thumbnail: string | null;
}

function buildEntry(id: number | 'none', name: string, sectionRoutes: DirectoryRoute[]): WallEntry {
  const sortedGrades = [...sectionRoutes.map((r) => r.grade)].sort(compareGrades);
  const thumbnail =
    [...sectionRoutes].sort((a, b) => b.created_at.localeCompare(a.created_at)).find((r) => r.image_url)
      ?.image_url ?? null;

  return {
    id,
    name,
    count: sectionRoutes.length,
    minGrade: sortedGrades[0] ?? null,
    maxGrade: sortedGrades[sortedGrades.length - 1] ?? null,
    thumbnail,
  };
}

export function WallDirectoryList({ sections, routes, onSelectSection }: WallDirectoryListProps) {
  const entries: WallEntry[] = sections.map((s) =>
    buildEntry(
      s.id,
      s.section_name,
      routes.filter((r) => r.section_id === s.id),
    ),
  );

  const unsectioned = routes.filter((r) => r.section_id == null);
  if (unsectioned.length > 0) {
    entries.push(buildEntry('none', 'Unsectioned', unsectioned));
  }

  if (entries.length === 0) {
    return <p className="text-gray-500 text-sm">No walls added yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {entries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onSelectSection(entry.id)}
          className="group relative h-[145px] sm:h-[220px] overflow-hidden rounded-2xl bg-gray-300 text-white text-left"
        >
          {entry.thumbnail ? (
            <img src={entry.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400" />
          )}

          <div className="absolute inset-0 bg-black/20 transition-colors duration-200 group-hover:bg-black/35" />

          {entry.minGrade && entry.maxGrade && (
            <span className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[10px] sm:text-xs font-semibold bg-white/90 text-gray-700 rounded-full px-2 py-0.5">
              {entry.minGrade === entry.maxGrade ? entry.minGrade : `${entry.minGrade}–${entry.maxGrade}`}
            </span>
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center">
            <h2 className="text-base sm:text-2xl font-semibold leading-tight drop-shadow-sm">{entry.name}</h2>
          </div>
        </button>
      ))}
    </div>
  );
}
