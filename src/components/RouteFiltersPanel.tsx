import { GRADE_ORDER, getGradeBadgeClasses } from '../lib/grades';
import type { RouteGrade } from '../types';

interface WallOption {
  id: number | 'none';
  name: string;
  count: number;
}

interface RouteFiltersPanelProps {
  wallOptions: WallOption[];
  selectedGrades: RouteGrade[];
  onToggleGrade: (grade: RouteGrade) => void;
  selectedSectionIds: (number | 'none')[];
  onToggleSection: (id: number | 'none') => void;
  onReset: () => void;
  matchCount: number;
}

export function RouteFiltersPanel({
  wallOptions,
  selectedGrades,
  onToggleGrade,
  selectedSectionIds,
  onToggleSection,
  onReset,
  matchCount,
}: RouteFiltersPanelProps) {
  return (
    <div className="absolute right-0 mt-2 w-72 rounded-xl border border-gray-200 bg-white shadow-lg z-20 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Grades</p>
      <div className="flex flex-wrap gap-2">
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

      {wallOptions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Jump to wall</p>
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {wallOptions.map((wall) => {
              const active = selectedSectionIds.includes(wall.id);
              return (
                <button
                  key={wall.id}
                  type="button"
                  onClick={() => onToggleSection(wall.id)}
                  className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
                    active ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium truncate">{wall.name}</span>
                  <span className="text-xs text-gray-500 shrink-0">
                    {wall.count} climb{wall.count === 1 ? '' : 's'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <button type="button" onClick={onReset} className="text-sm font-medium text-gray-500 hover:text-red-600">
          Reset
        </button>
        <span className="text-xs text-gray-400">
          {matchCount} climb{matchCount === 1 ? '' : 's'} match
        </span>
      </div>
    </div>
  );
}
