import { GRADE_SWATCH_BORDER, getGradeColorHex } from '../lib/grades';
import type { RouteGrade } from '../types';
import { ModalShell } from './ModalShell';

interface GradeBreakdownRow {
  grade: RouteGrade;
  count: number;
}

interface GradeBreakdownModalProps {
  gradeMix: GradeBreakdownRow[];
  totalClimbs: number;
  onClose: () => void;
}

export function GradeBreakdownModal({ gradeMix, totalClimbs, onClose }: GradeBreakdownModalProps) {
  const maxCount = Math.max(...gradeMix.map((row) => row.count), 1);

  return (
    <ModalShell title="Grade breakdown" onClose={onClose}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
        {totalClimbs} climb{totalClimbs === 1 ? '' : 's'}
      </p>
      <div className="space-y-3">
        {gradeMix.map((row) => (
          <div key={row.grade} className={`flex items-center gap-3 ${row.count === 0 ? 'opacity-40' : ''}`}>
            <span className="w-10 text-sm font-semibold text-gray-900 shrink-0">{row.grade}</span>
            <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full border"
                style={{
                  width: `${(row.count / maxCount) * 100}%`,
                  backgroundColor: getGradeColorHex(row.grade),
                  borderColor: GRADE_SWATCH_BORDER,
                }}
              />
            </div>
            <span className="w-6 text-sm font-semibold text-gray-900 text-right shrink-0">{row.count}</span>
            <span className="w-10 text-xs text-gray-500 text-right shrink-0">
              {totalClimbs === 0 ? 0 : Math.round((row.count / totalClimbs) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
