import { useParams } from 'react-router-dom';
import { GymAboutContent } from '../components/GymAboutContent';
import { useGymBySlug } from '../hooks/useGymBySlug';

export function GymAbout() {
  const { gymSlug } = useParams();
  const { data: gym, isLoading } = useGymBySlug(gymSlug);

  if (isLoading) return <p className="text-gray-500 text-sm">Loading…</p>;
  if (!gym) return <p className="text-gray-500 text-sm">Gym not found.</p>;

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">About {gym.gym_name}</h1>
        </div>
        <GymAboutContent gymId={gym.id} />
      </div>
    </div>
  );
}
