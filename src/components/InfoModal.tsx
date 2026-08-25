import { GymAboutContent } from './GymAboutContent';
import { ModalShell } from './ModalShell';

export function InfoModal({ gymId, onClose }: { gymId: number; onClose: () => void }) {
  return (
    <ModalShell title="Gym Info" onClose={onClose}>
      <GymAboutContent gymId={gymId} />
    </ModalShell>
  );
}
