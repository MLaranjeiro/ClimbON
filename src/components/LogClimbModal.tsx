import { useMyRouteLog } from '../hooks/useMyRouteLog';
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
  const { isLogged } = useMyRouteLog(routeId);

  return (
    <ModalShell title={isLogged ? 'Update Log' : 'Log Climb'} onClose={onClose}>
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
