import { GRADE_ORDER, getGradeBadgeClasses } from '../lib/grades';
import type { RouteGrade } from '../types';

interface GymMapFilterBarProps {
  selectedGrades: RouteGrade[];
  onToggleGrade: (grade: RouteGrade) => void;
  onReset: () => void;
  shownCount?: number;
  totalCount?: number;
}

export function GymMapFilterBar({ selectedGrades, onToggleGrade, onReset, shownCount, totalCount }: GymMapFilterBarProps) {
  const hasFilter = selectedGrades.length > 0;

  return (
    <div className="flex items-center gap-2 gap-y-1.5 flex-wrap min-w-0 flex-1">
      <div className="flex flex-wrap gap-1.5">
        {GRADE_ORDER.map((grade) => {
          const active = selectedGrades.includes(grade);
          return (
            <button
              key={grade}
              type="button"
              onClick={() => onToggleGrade(grade)}
              className={`badge cursor-pointer ${active ? getGradeBadgeClasses(grade) : 'bg-gray-100 text-gray-600'}`}
            >
              {grade}
            </button>
          );
        })}
      </div>
      {hasFilter && (
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-gray-500 hover:text-red-600 shrink-0"
        >
          Reset
        </button>
      )}
      {totalCount != null && shownCount != null && (
        <span className="text-xs text-gray-400 shrink-0">
          {shownCount} of {totalCount} climb{totalCount === 1 ? '' : 's'} shown
        </span>
      )}
    </div>
  );
}
