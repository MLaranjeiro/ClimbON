import { useNavigate, useParams } from 'react-router-dom';
import { SectionClimbsContent } from '../components/SectionClimbsContent';
import { useGymBySlug } from '../hooks/useGymBySlug';

export function SectionClimbs() {
  const { gymSlug, sectionId } = useParams();
  const navigate = useNavigate();
  const { data: gym, isLoading } = useGymBySlug(gymSlug);

  if (isLoading) return <p className="text-gray-500 text-sm">Loading…</p>;
  if (!gym) return <p className="text-gray-500 text-sm">Gym not found.</p>;

  const parsedSectionId = sectionId === 'none' ? 'none' : Number(sectionId);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <SectionClimbsContent
        gymId={gym.id}
        sectionId={parsedSectionId}
        onSelectRoute={(routeId) => navigate(`/routes/${gymSlug}/climbs/${routeId}`)}
      />
    </div>
  );
}
