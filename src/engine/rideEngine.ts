import type { Session, Program, Segment, Summary, Ride } from './types';
import type { BikeReading } from '../ble/BikeSource';
import { deriveSpeedKmh, deriveKcalPerSec } from './formulas';

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
export function resCue(s: Session): string {
  const seg = currentSegment(s); if (!seg) return '';
  if (seg.res > s.resistance) return ` ▲${seg.res - s.resistance}`;
  if (seg.res < s.resistance) return ` ▼${s.resistance - seg.res}`;
  return '';
}
export function buildSummary(s: Session, history: Ride[]): Summary {
  const km = s.distanceKm;
  const pb = km > Math.max(0, ...history.map(h => h.km));
  return { name: s.program ? s.program.name : 'Free ride', sec: s.elapsed, km,
    kcal: Math.round(s.calories), avgRpm: s.rpmN ? Math.round(s.rpmSum / s.rpmN) : 0, pb };
}
