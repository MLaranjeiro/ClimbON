import { GRADE_ORDER, gradeFromRatingValue } from './grades';
import type { RouteGrade } from '../types';

export interface RatingRow {
  // Difficulty vote stored as a GRADE_ORDER index (V0 = 0, V1 = 1, ...).
  grade: number;
  // Optional 1–5 quality vote, independent of difficulty (F6.4).
  quality: number | null;
}

export interface RatingSummary {
  avgDifficulty: number | null;
  communityGrade: RouteGrade | null;
  ratingCount: number;
  ratingDistribution: { grade: RouteGrade; count: number }[];
  avgQuality: number | null;
  qualityCount: number;
}

// Mean of a list of votes, or null when nobody has voted yet (so the UI can show
// "no ratings" instead of a misleading 0).
export function averageRating(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Turns a route's raw difficulty_ratings rows into the community figures shown on
// the route details page (F6.2, F6.3, F6.5).
export function summarizeRatings(ratings: RatingRow[]): RatingSummary {
  const avgDifficulty = averageRating(ratings.map((r) => r.grade));

  const counts = new Map<RouteGrade, number>();
  for (const r of ratings) {
    const g = gradeFromRatingValue(r.grade);
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  const ratingDistribution = GRADE_ORDER.filter((g) => counts.has(g)).map((grade) => ({
    grade,
    count: counts.get(grade)!,
  }));

  // Quality is optional per vote, so it's averaged only over the votes that have one.
  const qualityValues = ratings.map((r) => r.quality).filter((q): q is number => q != null);

  return {
    avgDifficulty,
    communityGrade: avgDifficulty != null ? gradeFromRatingValue(avgDifficulty) : null,
    ratingCount: ratings.length,
    ratingDistribution,
    avgQuality: averageRating(qualityValues),
    qualityCount: qualityValues.length,
  };
}
