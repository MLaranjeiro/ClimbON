import { describe, expect, it } from 'vitest';
import { sortRoutes, type SortableRoute } from '../../lib/routeSort';

const routes: SortableRoute[] = [
  { route_name: 'Green Crimps', grade: 'V4', avgDifficulty: 4.5, sendCount: 3 },
  { route_name: 'Slab Dance', grade: 'V1', avgDifficulty: null, sendCount: 10 },
  { route_name: 'Roof Monster', grade: 'V7', avgDifficulty: 6.8, sendCount: 0 },
  { route_name: 'Arete Party', grade: 'V4', avgDifficulty: 3.9, sendCount: 3 },
];

const names = (list: SortableRoute[]) => list.map((r) => r.route_name);

describe('sortRoutes (F7.2)', () => {
  it('sorts by grade easiest-first, breaking ties by name', () => {
    expect(names(sortRoutes(routes, 'grade', 'asc'))).toEqual([
      'Slab Dance',
      'Arete Party',
      'Green Crimps',
      'Roof Monster',
    ]);
  });

  it('sorts by grade hardest-first', () => {
    expect(names(sortRoutes(routes, 'grade', 'desc'))[0]).toBe('Roof Monster');
  });

  it('sorts by average difficulty rating', () => {
    expect(names(sortRoutes(routes, 'difficulty', 'asc'))).toEqual([
      'Arete Party',
      'Green Crimps',
      'Roof Monster',
      'Slab Dance',
    ]);
  });

  it('keeps unrated routes last in both directions', () => {
    expect(names(sortRoutes(routes, 'difficulty', 'asc')).at(-1)).toBe('Slab Dance');
    expect(names(sortRoutes(routes, 'difficulty', 'desc')).at(-1)).toBe('Slab Dance');
  });

  it('sorts by number of logged sends, most first', () => {
    expect(names(sortRoutes(routes, 'sends', 'desc'))).toEqual([
      'Slab Dance',
      'Arete Party',
      'Green Crimps',
      'Roof Monster',
    ]);
  });

  it('does not mutate the input array', () => {
    const original = names(routes);
    sortRoutes(routes, 'sends', 'desc');
    expect(names(routes)).toEqual(original);
  });
});
