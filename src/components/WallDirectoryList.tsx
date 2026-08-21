import { Mountain } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  gymId: number;
  sections: { id: number; section_name: string }[];
  routes: DirectoryRoute[];
}

interface WallEntry {
  id: number | 'none';
  name: string;
  count: number;
  minGrade: RouteGrade | null;
  maxGrade: RouteGrade | null;
  thumbnail: string | null;
  latestCreatedAt: string | null;
}

function buildEntry(id: number | 'none', name: string, sectionRoutes: DirectoryRoute[]): WallEntry {
  const sortedGrades = [...sectionRoutes.map((r) => r.grade)].sort(compareGrades);
  const thumbnail =
    [...sectionRoutes].sort((a, b) => b.created_at.localeCompare(a.created_at)).find((r) => r.image_url)
      ?.image_url ?? null;
  const latestCreatedAt =
    sectionRoutes.length > 0
      ? sectionRoutes.reduce((max, r) => (r.created_at > max ? r.created_at : max), sectionRoutes[0].created_at)
      : null;

  return {
    id,
    name,
    count: sectionRoutes.length,
    minGrade: sortedGrades[0] ?? null,
    maxGrade: sortedGrades[sortedGrades.length - 1] ?? null,
    thumbnail,
    latestCreatedAt,
  };
}

export function WallDirectoryList({ gymId, sections, routes }: WallDirectoryListProps) {
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
    <div className="space-y-2">
      {entries.map((entry) => (
        <Link
          key={entry.id}
          to={`/routes/${gymId}/sections/${entry.id}`}
          className="flex items-center gap-4 rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors"
        >
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
            {entry.thumbnail ? (
              <img src={entry.thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <Mountain className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 truncate">{entry.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {entry.count} climb{entry.count === 1 ? '' : 's'}
              {entry.latestCreatedAt && (
                <>
                  {' '}
                  · Set{' '}
                  {new Date(entry.latestCreatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </>
              )}
            </p>
          </div>
          {entry.minGrade && entry.maxGrade && (
            <span className="text-xs font-medium text-gray-500 shrink-0">
              {entry.minGrade === entry.maxGrade ? entry.minGrade : `${entry.minGrade}–${entry.maxGrade}`}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
