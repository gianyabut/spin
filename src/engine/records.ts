import type { Ride } from './types';

/**
 * Personal-record helpers for the lime-PULSE redesign. All pure functions over
 * ride history, so they unit-test with no hardware. The redesign tracks records
 * PER PROGRAM (beating your best HIIT 30 counts, even if it's shorter than your
 * longest-ever endurance ride) — see the Summary "previous best" and the Rides /
 * Profile records strips.
 */

/** Max distance (km) ever ridden for `name`; 0 if that program has no history. */
export function bestKmForProgram(rides: Ride[], name: string): number {
  return Math.max(0, ...rides.filter(r => r.name === name).map(r => r.km));
}

/** Would `km` set a new personal best for `name`, given the prior `rides`? */
export function isProgramPB(rides: Ride[], name: string, km: number): boolean {
  return km > bestKmForProgram(rides, name);
}

export type Records = { longestKm: number; byProgram: Record<string, number> };

/** Longest single ride overall + best distance per program name. */
export function records(rides: Ride[]): Records {
  const byProgram: Record<string, number> = {};
  for (const r of rides) byProgram[r.name] = Math.max(byProgram[r.name] ?? 0, r.km);
  return { longestKm: Math.max(0, ...rides.map(r => r.km)), byProgram };
}

const MS_WEEK = 7 * 24 * 3600 * 1000;

/**
 * Per-week distance totals for the Rides trend chart: `weeks` buckets, oldest
 * first and the current week last, summed from each ride's `date` (YYYY-MM-DD)
 * relative to `now`. Rides outside the window (or with an unparseable date) are
 * skipped. `now` is injectable so the chart is deterministic in tests.
 */
export function weeklyKm(rides: Ride[], weeks = 6, now: Date = new Date()): number[] {
  const out = new Array(weeks).fill(0);
  const end = now.getTime();
  for (const r of rides) {
    const t = new Date(r.date + 'T00:00:00').getTime();
    if (Number.isNaN(t)) continue;
    const weeksAgo = Math.floor((end - t) / MS_WEEK); // 0 = this week
    if (weeksAgo < 0 || weeksAgo >= weeks) continue;
    out[weeks - 1 - weeksAgo] += r.km;
  }
  return out;
}

/**
 * Live "ghost race" delta for the ride screen: how far ahead (+) or behind (−),
 * in km, the rider is versus a constant-pace ghost of their PB ride at the same
 * elapsed time. Returns 0 when there is no PB to race (pbSec ≤ 0).
 */
export function ghostAheadKm(distanceKm: number, elapsedSec: number, pbKm: number, pbSec: number): number {
  if (pbSec <= 0) return 0;
  const ghost = pbKm * Math.min(1, elapsedSec / pbSec);
  return +(distanceKm - ghost).toFixed(2);
}
