import type { RouteGrade } from '../types';

export const GRADE_ORDER: RouteGrade[] = [
  'VB', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5',
  'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12',
];

export function compareGrades(a: RouteGrade, b: RouteGrade): number {
  return GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b);
}

export function getHighestGrade(grades: RouteGrade[]): RouteGrade | null {
  if (grades.length === 0) return null;
  return [...grades].sort(compareGrades).at(-1) ?? null;
}

const GRADE_BUCKETS: { grades: RouteGrade[]; hex: string; badge: string }[] = [
  { grades: ['VB', 'V0', 'V1'], hex: '#16a34a', badge: 'bg-green-100 text-green-700' },
  { grades: ['V2', 'V3', 'V4'], hex: '#2563eb', badge: 'bg-blue-100 text-blue-700' },
  { grades: ['V5', 'V6', 'V7'], hex: '#7c3aed', badge: 'bg-violet-100 text-violet-700' },
  { grades: ['V8', 'V9', 'V10'], hex: '#ea580c', badge: 'bg-orange-100 text-orange-700' },
  { grades: ['V11', 'V12'], hex: '#dc2626', badge: 'bg-red-100 text-red-700' },
];

export function getGradeColorHex(grade: RouteGrade): string {
  return GRADE_BUCKETS.find((b) => b.grades.includes(grade))?.hex ?? '#6b7280';
}

export function getGradeBadgeClasses(grade: RouteGrade): string {
  return GRADE_BUCKETS.find((b) => b.grades.includes(grade))?.badge ?? 'bg-gray-100 text-gray-700';
}

export function meetsGrade(grade: RouteGrade | null | undefined, threshold: RouteGrade): boolean {
  if (!grade) return false;
  return GRADE_ORDER.indexOf(grade) >= GRADE_ORDER.indexOf(threshold);
}
