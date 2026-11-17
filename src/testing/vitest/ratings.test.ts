import { describe, expect, it } from 'vitest';
import { averageRating, summarizeRatings } from '../../lib/ratings';

describe('averageRating (F6.2, F6.5)', () => {
  it('TC-07: a new rating of 5 on an existing 4.5 average raises the average', () => {
    // Existing average 4.5 from two votes (4 and 5); a third vote of 5 is added.
    expect(averageRating([4, 5])).toBe(4.5);
    expect(averageRating([4, 5, 5])).toBeCloseTo(14 / 3);
    expect(averageRating([4, 5, 5])!).toBeGreaterThan(4.5);
  });

  it('returns the value itself for a single rating', () => {
    expect(averageRating([3])).toBe(3);
  });

  it('returns null when there are no ratings', () => {
    expect(averageRating([])).toBeNull();
  });

  it('does not mutate the input array', () => {
    const values = [5, 1, 3];
    averageRating(values);
    expect(values).toEqual([5, 1, 3]);
  });
});

describe('summarizeRatings (F6.2, F6.3, F6.5)', () => {
  it('averages difficulty votes and rounds to the community grade', () => {
    // V1 and V3 votes → average 2.0 → V2 (matches the route details page).
    const summary = summarizeRatings([
      { grade: 1, quality: 4 },
      { grade: 3, quality: 4 },
    ]);
    expect(summary.avgDifficulty).toBe(2);
    expect(summary.communityGrade).toBe('V2');
    expect(summary.ratingCount).toBe(2);
  });

  it('rounds a half-grade average up to the harder grade', () => {
    const summary = summarizeRatings([
      { grade: 2, quality: null },
      { grade: 3, quality: null },
    ]);
    expect(summary.avgDifficulty).toBe(2.5);
    expect(summary.communityGrade).toBe('V3');
  });

  it('builds the vote distribution in grade order', () => {
    const summary = summarizeRatings([
      { grade: 3, quality: null },
      { grade: 1, quality: null },
      { grade: 3, quality: null },
    ]);
    expect(summary.ratingDistribution).toEqual([
      { grade: 'V1', count: 1 },
      { grade: 'V3', count: 2 },
    ]);
  });

  it('averages quality only over votes that include one', () => {
    const summary = summarizeRatings([
      { grade: 2, quality: 5 },
      { grade: 2, quality: 3 },
      { grade: 2, quality: null },
    ]);
    expect(summary.avgQuality).toBe(4);
    expect(summary.qualityCount).toBe(2);
    expect(summary.ratingCount).toBe(3);
  });

  it('keeps difficulty and quality independent (F6.4)', () => {
    const summary = summarizeRatings([
      { grade: 8, quality: 1 },
      { grade: 8, quality: 1 },
    ]);
    expect(summary.communityGrade).toBe('V8');
    expect(summary.avgQuality).toBe(1);
  });

  it('returns empty figures for an unrated route', () => {
    expect(summarizeRatings([])).toEqual({
      avgDifficulty: null,
      communityGrade: null,
      ratingCount: 0,
      ratingDistribution: [],
      avgQuality: null,
      qualityCount: 0,
    });
  });
});
