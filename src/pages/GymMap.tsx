import { useParams } from 'react-router-dom';
import { GymMapContent } from '../components/GymMapContent';
import { useGymBySlug } from '../hooks/useGymBySlug';

export function GymMap() {
  const { gymSlug } = useParams();
  const { data: gym, isLoading } = useGymBySlug(gymSlug);

  if (isLoading) return <p className="text-gray-500 text-sm">Loading…</p>;
  if (!gym) return <p className="text-gray-500 text-sm">Gym not found.</p>;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{gym.gym_name} — Gym Map</h1>
      </div>
      <GymMapContent gymId={gym.id} />
    </div>
  );
}
