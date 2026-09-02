import type { RouteGrade } from '../types';
import { LogClimbForm } from './LogClimbForm';
import { ModalShell } from './ModalShell';

interface LogClimbModalProps {
  routeId: number;
  routeName: string;
  grade: RouteGrade;
  sectionName?: string | null;
  onClose: () => void;
}

export function LogClimbModal({ routeId, routeName, grade, sectionName, onClose }: LogClimbModalProps) {
  return (
    <ModalShell title="Log Climb" onClose={onClose} maxWidthClass="max-w-md">
      <LogClimbForm
        routeId={routeId}
        routeName={routeName}
        grade={grade}
        sectionName={sectionName}
        onDone={onClose}
      />
    </ModalShell>
  );
}
