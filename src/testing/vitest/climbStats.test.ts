import { describe, expect, it } from 'vitest';
import { computeWeeklyStreak, countClimbsPerGrade, getDistinctSends } from '../../lib/climbStats';
import type { SendType } from '../../types';

function send(routeId: number | null, date: string, send_type: SendType = 'send') {
  return { send_type, date_completed: date, route: routeId == null ? null : { id: routeId } };
}

describe('getDistinctSends (F2.2.1 total climbs)', () => {
  it('TC-05: logging a send on a new route raises total climbs by 1', () => {
    const history = [send(1, '2026-11-01'), send(2, '2026-11-02')];
    expect(getDistinctSends(history)).toHaveLength(2);
    expect(getDistinctSends([...history, send(3, '2026-11-03')])).toHaveLength(3);
  });

  it('counts a route sent more than once only once', () => {
    const sends = [send(1, '2026-11-01', 'flash'), send(1, '2026-11-05', 'repeat'), send(1, '2026-11-09', 'repeat')];
    expect(getDistinctSends(sends)).toHaveLength(1);
  });

  it('keeps the first send of a repeated route, whatever order the rows arrive in', () => {
    const sends = [send(1, '2026-11-09', 'repeat'), send(1, '2026-11-01', 'send'), send(1, '2026-11-05', 'repeat')];
    expect(getDistinctSends(sends)[0].date_completed).toBe('2026-11-01');
  });

  it('does not count attempts', () => {
    const sends = [send(1, '2026-11-01', 'attempt'), send(2, '2026-11-02', 'attempt'), send(3, '2026-11-03')];
    expect(getDistinctSends(sends).map((s) => s.route?.id)).toEqual([3]);
  });

  it('counts a route that was attempted first and sent later', () => {
    const sends = [send(1, '2026-11-01', 'attempt'), send(1, '2026-11-08', 'send')];
    expect(getDistinctSends(sends)).toHaveLength(1);
    expect(getDistinctSends(sends)[0].date_completed).toBe('2026-11-08');
  });

  it('skips sends whose route no longer exists', () => {
    expect(getDistinctSends([send(null, '2026-11-01'), send(2, '2026-11-02')])).toHaveLength(1);
  });

  it('returns nothing for an empty history', () => {
    expect(getDistinctSends([])).toEqual([]);
  });
});

describe('countClimbsPerGrade (F2.2.3.2)', () => {
  it('counts routes climbed at each grade', () => {
    const counts = countClimbsPerGrade(['V2', 'V1', 'V2', 'V3', 'V2']);
    expect(counts.find((c) => c.grade === 'V1')?.count).toBe(1);
    expect(counts.find((c) => c.grade === 'V2')?.count).toBe(3);
    expect(counts.find((c) => c.grade === 'V3')?.count).toBe(1);
    expect(counts.find((c) => c.grade === 'V0')?.count).toBe(0);
  });

  it('the counts add up to the number of climbs', () => {
    const grades = ['V0', 'V4', 'V4', 'V5', 'V1'] as const;
    const total = countClimbsPerGrade([...grades]).reduce((sum, c) => sum + c.count, 0);
    expect(total).toBe(grades.length);
  });

  it('runs from V0 to two grades past the hardest send', () => {
    expect(countClimbsPerGrade(['V3']).map((c) => c.grade)).toEqual(['V0', 'V1', 'V2', 'V3', 'V4', 'V5']);
  });

  it('stops at V10 when the hardest send is near the top of the scale', () => {
    const grades = countClimbsPerGrade(['V9']).map((c) => c.grade);
    expect(grades[grades.length - 1]).toBe('V10');
    expect(grades).toHaveLength(11);
  });

  it('shows the full scale with zero counts when nothing has been sent', () => {
    const counts = countClimbsPerGrade([]);
    expect(counts).toHaveLength(11);
    expect(counts.every((c) => c.count === 0)).toBe(true);
  });
});

describe('computeWeeklyStreak', () => {
  // Wednesday 18 Nov 2026, local time. Test dates are all Wednesdays so a date string
  // parsed as UTC midnight stays in the same Sunday-to-Saturday week in any timezone.
  const now = new Date(2026, 10, 18, 12);

  it('counts consecutive weeks with a climb, ending this week', () => {
    expect(computeWeeklyStreak(['2026-11-18', '2026-11-11', '2026-11-04'], now)).toBe(3);
  });

  it('a week with no climbs ends the streak', () => {
    expect(computeWeeklyStreak(['2026-11-18', '2026-11-04', '2026-10-28'], now)).toBe(1);
  });

  it('is 0 when there is no climb this week yet', () => {
    expect(computeWeeklyStreak(['2026-11-11', '2026-11-04'], now)).toBe(0);
  });

  it('several climbs in one week count as one week', () => {
    expect(computeWeeklyStreak(['2026-11-18', '2026-11-18', '2026-11-11'], now)).toBe(2);
  });

  it('carries on across the daylight-saving change on 1 Nov 2026', () => {
    // The week of 1 Nov is 169 hours long in DST timezones; the streak must not break there.
    expect(computeWeeklyStreak(['2026-11-18', '2026-11-11', '2026-11-04', '2026-10-28', '2026-10-21'], now)).toBe(5);
  });

  it('is 0 with no climbs at all', () => {
    expect(computeWeeklyStreak([], now)).toBe(0);
  });
});
