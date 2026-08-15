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
