import { Link } from 'react-router-dom';
import { getGradeBadgeClasses } from '../lib/grades';
import type { RouteGrade } from '../types';

interface RouteRowProps {
  gymSlug: string;
  route: {
    id: number;
    route_name: string;
    grade: RouteGrade;
    styles: string[];
  };
}

export function RouteRow({ gymSlug, route }: RouteRowProps) {
  return (
    <Link
      to={`/routes/${gymSlug}/climbs/${route.id}`}
      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 hover:border-gray-300 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`badge ${getGradeBadgeClasses(route.grade)}`}>{route.grade}</span>
        <span className="font-medium text-gray-900 truncate">{route.route_name}</span>
      </div>
      {route.styles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
          {route.styles.slice(0, 3).map((style) => (
            <span key={style} className="badge bg-gray-100 text-gray-600 text-xs">
              {style}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
