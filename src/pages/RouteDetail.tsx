import { CheckCircle, Mountain, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BetaList } from '../components/BetaList';
import { LogClimbModal } from '../components/LogClimbModal';
import { useRouteDetail } from '../hooks/useRouteDetail';
import { getGradeBadgeClasses } from '../lib/grades';

export function RouteDetail() {
  const { gymSlug, routeId } = useParams();
  const id = Number(routeId);
  const [showLogClimb, setShowLogClimb] = useState(false);

  const { route, isLoading, beta, stats } = useRouteDetail(id);

  if (isLoading) return <p className="text-gray-500 text-sm">Loading…</p>;
  if (!route) return <p className="text-gray-500 text-sm">Route not found.</p>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link to={`/routes/${gymSlug}`} className="text-sm text-brand-600 hover:underline">
          {route.gym?.gym_name ?? 'Gym'}
        </Link>
        {route.section && <span className="text-sm text-gray-400"> · {route.section.section_name}</span>}
      </div>

      <div className="w-full h-56 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
        {route.image_url ? (
          <img src={route.image_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <Mountain className="w-10 h-10 text-gray-300" />
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{route.route_name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`badge ${getGradeBadgeClasses(route.grade)}`}>{route.grade}</span>
            {route.status === 'inactive' && <span className="badge bg-gray-100 text-gray-500">Retired</span>}
          </div>
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

      {route.styles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {route.styles.map((style) => (
            <span key={style} className="badge bg-gray-100 text-gray-600">
              {style}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-6 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4" />
          {stats?.sendCount ?? 0} send{stats?.sendCount === 1 ? '' : 's'}
        </span>
        {stats?.avgDifficulty != null && <span>Avg. difficulty rating {stats.avgDifficulty.toFixed(1)}</span>}
      </div>

      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Beta</h2>
        {!beta || beta.length === 0 ? (
          <p className="text-gray-500 text-sm">No beta uploaded yet.</p>
        ) : (
          <BetaList beta={beta} />
        )}
      </section>

      {showLogClimb && (
        <LogClimbModal
          routeId={route.id}
          routeName={route.route_name}
          grade={route.grade}
          sectionName={route.section?.section_name}
          onClose={() => setShowLogClimb(false)}
        />
      )}
    </div>
  );
}
