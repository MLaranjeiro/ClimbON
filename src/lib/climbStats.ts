import { GRADE_ORDER, getHighestGrade } from './grades';
import type { RouteGrade, SendType } from '../types';

export interface SendLike {
  send_type: SendType;
  date_completed: string;
  route: { id: number } | null;
}

// The sends that count toward profile stats (F2.2): attempts are dropped, and a route
// sent more than once (repeats, warmup laps) only counts once — keeping the first time
// it was sent, so "this week"/"this month" figures credit the original send date.
export function getDistinctSends<T extends SendLike>(sends: T[]): T[] {
  const firstSendByRoute = new Map<number, T>();
  for (const s of sends) {
    if (s.send_type === 'attempt') continue;
    const routeId = s.route?.id;
    if (routeId == null) continue;
    const existing = firstSendByRoute.get(routeId);
    if (!existing || s.date_completed < existing.date_completed) {
      firstSendByRoute.set(routeId, s);
    }
  }
  return [...firstSendByRoute.values()];
}

// Number of routes climbed per grade (F2.2.3.2) for the profile bar chart. The chart
// runs from V0 to two grades past the climber's hardest send (so there's headroom to
// see what's next), or the full scale when nothing has been sent yet.
export function countClimbsPerGrade(grades: RouteGrade[]): { grade: RouteGrade; count: number }[] {
  const highest = getHighestGrade(grades);
  const lastIndex = highest
    ? Math.min(GRADE_ORDER.indexOf(highest) + 2, GRADE_ORDER.length - 1)
    : GRADE_ORDER.length - 1;
  return GRADE_ORDER.slice(0, lastIndex + 1).map((grade) => ({
    grade,
    count: grades.filter((g) => g === grade).length,
  }));
}

// Weeks start on Sunday, at local midnight.
export function getWeekStart(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.getTime();
}

// Consecutive weeks, counting back from the current one, with at least one climb.
// A week with no climbs ends the streak; climbing several times in a week counts once.
export function computeWeeklyStreak(dates: string[], now: Date = new Date()): number {
  if (dates.length === 0) return 0;
  const weeks = new Set(dates.map((d) => getWeekStart(new Date(d))));
  let streak = 0;
  const cursor = new Date(getWeekStart(now));
  while (weeks.has(cursor.getTime())) {
    streak += 1;
    // Step back by calendar days rather than a fixed 7×24h so a daylight-saving
    // change inside the streak doesn't throw the week boundaries off by an hour.
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}
