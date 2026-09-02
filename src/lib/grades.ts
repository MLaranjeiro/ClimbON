import type { RouteGrade } from '../types';

export const GRADE_ORDER: RouteGrade[] = ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10'];

export function compareGrades(a: RouteGrade, b: RouteGrade): number {
  return GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b);
}

export function getHighestGrade(grades: RouteGrade[]): RouteGrade | null {
  if (grades.length === 0) return null;
  return [...grades].sort(compareGrades).at(-1) ?? null;
}

const GRADE_BUCKETS: { grades: RouteGrade[]; hex: string; badge: string }[] = [
  { grades: ['V0'], hex: '#ffffff', badge: 'bg-white text-gray-700 border border-gray-300' },
  { grades: ['V1'], hex: '#eab308', badge: 'bg-yellow-100 text-yellow-800' },
  { grades: ['V2'], hex: '#f97316', badge: 'bg-orange-100 text-orange-700' },
  { grades: ['V3'], hex: '#16a34a', badge: 'bg-green-100 text-green-700' },
  { grades: ['V4'], hex: '#2563eb', badge: 'bg-blue-100 text-blue-700' },
  { grades: ['V5', 'V6'], hex: '#9333ea', badge: 'bg-purple-100 text-purple-700' },
  { grades: ['V7'], hex: '#dc2626', badge: 'bg-red-100 text-red-700' },
  { grades: ['V8'], hex: '#171717', badge: 'bg-gray-800 text-white' },
  { grades: ['V9', 'V10'], hex: '#ec4899', badge: 'bg-pink-100 text-pink-700' },
];

export function getGradeColorHex(grade: RouteGrade): string {
  return GRADE_BUCKETS.find((b) => b.grades.includes(grade))?.hex ?? '#6b7280';
}

// Subtle neutral outline for any flat dot/bar/chart-cell rendering of a grade's hex color —
// without it, the V0 (white) swatch is invisible against the app's white surfaces.
export const GRADE_SWATCH_BORDER = '#d1d5db';

// For map-pin style dots that already use a white ring to stand out from the map image —
// keep white for every color except V0, where white would disappear entirely.
export function getGradePinBorderHex(grade: RouteGrade): string {
  return grade === 'V0' ? GRADE_SWATCH_BORDER : '#ffffff';
}

// Sent-route checkmark drawn inside a pin needs a dark mark on the light pin fills
// (white V0, yellow V1) and a light mark everywhere else to stay legible.
export function getGradePinIconHex(grade: RouteGrade): string {
  return grade === 'V0' || grade === 'V1' ? '#171717' : '#ffffff';
}

export function getGradeBadgeClasses(grade: RouteGrade): string {
  return GRADE_BUCKETS.find((b) => b.grades.includes(grade))?.badge ?? 'bg-gray-100 text-gray-700';
}

export function meetsGrade(grade: RouteGrade | null | undefined, threshold: RouteGrade): boolean {
  if (!grade) return false;
  return GRADE_ORDER.indexOf(grade) >= GRADE_ORDER.indexOf(threshold);
}

// Assumes difficulty_ratings.grade stores the plain V-number (V0 = 0, V1 = 1, … V10 = 10),
// clamped to the V0–V10 range.
export function gradeFromRatingValue(value: number): RouteGrade {
  const idx = Math.min(Math.max(Math.round(value), 0), GRADE_ORDER.length - 1);
  return GRADE_ORDER[idx];
}

// Inverse of gradeFromRatingValue — for writing a submitted grade suggestion back to
// difficulty_ratings.grade.
export function gradeToRatingValue(grade: RouteGrade): number {
  return GRADE_ORDER.indexOf(grade);
}
