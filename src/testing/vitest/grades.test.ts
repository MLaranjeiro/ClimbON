import { describe, expect, it } from 'vitest';
import { compareGrades, getHighestGrade } from '../../lib/grades';
import type { RouteGrade } from '../../types';

describe('compareGrades', () => {
  it('orders grades from easiest to hardest', () => {
    expect(compareGrades('V0', 'V4')).toBeLessThan(0);
    expect(compareGrades('V10', 'V0')).toBeGreaterThan(0);
    expect(compareGrades('V5', 'V5')).toBe(0);
  });
});

describe('getHighestGrade', () => {
  it('returns the single hardest grade from an unsorted list', () => {
    const grades: RouteGrade[] = ['V2', 'V6', 'V0', 'V4'];
    expect(getHighestGrade(grades)).toBe('V6');
  });

  it('returns the grade itself for a single-element list', () => {
    expect(getHighestGrade(['V3'])).toBe('V3');
  });

  it('returns null for an empty climb history', () => {
    expect(getHighestGrade([])).toBeNull();
  });

  it('does not mutate the input array', () => {
    const grades: RouteGrade[] = ['V5', 'V1', 'V8'];
    const original = [...grades];
    getHighestGrade(grades);
    expect(grades).toEqual(original);
  });
});
