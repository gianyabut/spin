import type { Session, Program, Segment, Summary, Ride } from './types';
import type { BikeReading } from '../ble/BikeSource';
import { deriveSpeedKmh, deriveKcalPerSec } from './formulas';
import { bestKmForProgram } from './records';

export function startSession(program: Program | null): Session {
  return {
    program, elapsed: 0, segIdx: 0, segElapsed: 0, paused: false,
    cadence: 62, resistance: program ? program.segs[0].res : 8,
    speedKmh: 0, distanceKm: 0, calories: 0, power: 0, rpmSum: 0, rpmN: 0,
  };
}
export const currentSegment = (s: Session): Segment | null => s.program ? s.program.segs[s.segIdx] : null;
export const togglePause = (s: Session): Session => ({ ...s, paused: !s.paused });

export function tick(s: Session, r: BikeReading): { session: Session; finished: boolean } {
  if (s.paused) return { session: s, finished: false };
  let segIdx = s.segIdx, segElapsed = s.segElapsed + 1, resistance = r.resistance ?? s.resistance;
  if (s.program) {
    let seg = s.program.segs[segIdx];
    if (segElapsed >= seg.dur) {
      segIdx++; segElapsed = 0;
      if (segIdx >= s.program.segs.length) return { session: { ...s, elapsed: s.elapsed + 1 }, finished: true };
      resistance = s.program.segs[segIdx].res; // snap to new target (real bike: read broadcast instead)
    }
  }
  const cadence = r.cadence;
  const speedKmh = r.speedKmh ?? deriveSpeedKmh(cadence, resistance);
  return {
    session: {
      ...s, elapsed: s.elapsed + 1, segIdx, segElapsed, resistance, cadence, speedKmh,
      distanceKm: r.distanceKm ?? s.distanceKm + speedKmh / 3600,
      calories: r.calories ?? s.calories + deriveKcalPerSec(cadence, resistance),
      power: r.power ?? s.power,
      rpmSum: s.rpmSum + cadence, rpmN: s.rpmN + 1,
    },
    finished: false,
  };
}
export type ResistanceCue = { target: number; onTarget: boolean; dir: 'up' | 'down' | 'ok' };

// Guidance for hitting the interval's resistance target on the bike's 0–100 scale.
// Compares the LIVE resistance read from the bike (s.resistance) to the interval's
// resTarget. Null when there's no target (free ride, or a segment without one).
// A ±3 tolerance counts as "on target" since the S3 knob is turned by hand.
export function resistanceCue(s: Session): ResistanceCue | null {
  const seg = currentSegment(s);
  if (!seg || seg.resTarget == null) return null;
  const target = seg.resTarget;
  const diff = s.resistance - target;
  if (Math.abs(diff) <= 3) return { target, onTarget: true, dir: 'ok' };
  return { target, onTarget: false, dir: diff > 0 ? 'down' : 'up' };
}
export function buildSummary(s: Session, history: Ride[]): Summary {
  const km = s.distanceKm;
  const name = s.program ? s.program.name : 'Free ride';
  // Per-program PB (redesign): beating your best HIIT counts even if a longer
  // endurance ride exists. prevBestKm feeds the Summary's "PREVIOUS BEST" line.
  const prevBestKm = bestKmForProgram(history, name);
  const pb = km > prevBestKm;
  return { name, sec: s.elapsed, km,
    kcal: Math.round(s.calories), avgRpm: s.rpmN ? Math.round(s.rpmSum / s.rpmN) : 0, pb, prevBestKm };
}
