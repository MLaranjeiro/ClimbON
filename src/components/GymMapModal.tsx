import { GymMapContent } from './GymMapContent';
import { ModalShell } from './ModalShell';

export function GymMapModal({ gymId, onClose }: { gymId: number; onClose: () => void }) {
  return (
    <ModalShell title="Gym Map" onClose={onClose} maxWidthClass="max-w-5xl">
      <GymMapContent gymId={gymId} />
    </ModalShell>
  );
}
