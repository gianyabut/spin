import { bestKmForProgram, isProgramPB, records, weeklyKm, ghostAheadKm } from '../src/engine/records';
import type { Ride } from '../src/engine/types';

const ride = (name: string, km: number, date = '2026-09-05'): Ride =>
  ({ id: name + km, name, when: 'TODAY', min: 30, km, kcal: 300, date });

const HIST: Ride[] = [
  ride('HIIT 30', 11.2, '2026-08-27'),
  ride('HIIT 30', 12.4, '2026-09-01'),
  ride('Free ride', 14.8, '2026-08-26'),
  ride('ENDURANCE 45', 16.1, '2026-08-24'),
];

test('bestKmForProgram returns the max distance for that program, 0 if unseen', () => {
  expect(bestKmForProgram(HIST, 'HIIT 30')).toBe(12.4);
  expect(bestKmForProgram(HIST, 'ENDURANCE 45')).toBe(16.1);
  expect(bestKmForProgram(HIST, 'PYRAMID 20')).toBe(0);
});

test('isProgramPB is per-program, not global', () => {
  // 13.1 beats the HIIT best (12.4) even though it is below the global max (16.1)
  expect(isProgramPB(HIST, 'HIIT 30', 13.1)).toBe(true);
  expect(isProgramPB(HIST, 'HIIT 30', 12.0)).toBe(false);
  // any distance is a PB for a program with no history
  expect(isProgramPB(HIST, 'PYRAMID 20', 0.1)).toBe(true);
});

test('records reports longest ride and best-per-program', () => {
  const r = records(HIST);
  expect(r.longestKm).toBe(16.1);
  expect(r.byProgram['HIIT 30']).toBe(12.4);
  expect(r.byProgram['ENDURANCE 45']).toBe(16.1);
});

test('weeklyKm buckets distance into the last N weeks, oldest→newest', () => {
  const now = new Date('2026-09-05T12:00:00');
  const rides: Ride[] = [
    ride('a', 10, '2026-09-05'), // this week
    ride('b', 5, '2026-09-02'),  // this week
    ride('c', 7, '2026-08-28'),  // last week (8 days ago)
    ride('d', 99, '2026-01-01'), // far outside → ignored
  ];
  const w = weeklyKm(rides, 6, now);
  expect(w).toHaveLength(6);
  expect(w[5]).toBeCloseTo(15); // newest bucket = this week
  expect(w[4]).toBeCloseTo(7);  // previous week
  expect(w[0]).toBe(0);
});

test('ghostAheadKm compares against a constant-pace ghost of the PB ride', () => {
  // halfway through the PB's time, ghost has covered half its distance
  expect(ghostAheadKm(5, 600, 12, 1800)).toBeCloseTo(1);   // 5 - 12*(600/1800)=4 → +1
  expect(ghostAheadKm(3, 1800, 12, 1800)).toBeCloseTo(-9); // behind at the finish line
  expect(ghostAheadKm(5, 600, 12, 0)).toBe(0);             // no PB time → neutral
});
