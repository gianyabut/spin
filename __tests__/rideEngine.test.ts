import { startSession, tick, togglePause, buildSummary, resistanceCue } from '../src/engine/rideEngine';
import { PROGRAMS } from '../src/engine/programs';
import type { BikeReading } from '../src/ble/BikeSource';
const R = (cadence: number): BikeReading => ({ cadence, ts: 0 });

test('free ride accumulates distance and calories from cadence', () => {
  let s = startSession(null); s = { ...s, resistance: 10 };
  const { session } = tick(s, R(90));
  expect(session.elapsed).toBe(1);
  expect(session.distanceKm).toBeGreaterThan(0);
  expect(session.calories).toBeGreaterThan(0);
});

test('paused tick does not advance time or distance', () => {
  let s = togglePause(startSession(null));
  const { session } = tick(s, R(90));
  expect(session.elapsed).toBe(0);
  expect(session.distanceKm).toBe(0);
});

test('program advances to next interval when segment duration elapses', () => {
  let s = startSession(PROGRAMS[2]); // PYRAMID: seg0 WARM UP dur 120
  for (let i = 0; i < 120; i++) s = tick(s, R(80)).session;
  expect(s.segIdx).toBe(1); // advanced to CLIMB 1
  expect(s.resistance).toBe(12); // snapped to new segment target
});

test('finishes after the last interval', () => {
  let s = startSession({ id: 't', name: 'T', desc: '', segs: [{ label: 'A', dur: 2, lo: 80, hi: 80, res: 10 }] });
  let out = tick(s, R(80)); expect(out.finished).toBe(false);
  out = tick(out.session, R(80)); // second tick reaches dur → finish
  expect(out.finished).toBe(true);
});

test('resistanceCue guides toward the interval target on the 0–100 scale', () => {
  let s = startSession(PROGRAMS[0]); // seg0 WARM UP, resTarget 50
  s = { ...s, resistance: 77 };
  expect(resistanceCue(s)).toEqual({ target: 50, onTarget: false, dir: 'down' }); // too high → lower
  s = { ...s, resistance: 40 };
  expect(resistanceCue(s)).toEqual({ target: 50, onTarget: false, dir: 'up' });   // too low → raise
  s = { ...s, resistance: 52 };
  expect(resistanceCue(s)!.onTarget).toBe(true);                                   // within ±3 → on target
});

test('resistanceCue is null for a free ride (no interval target)', () => {
  const s = { ...startSession(null), resistance: 40 };
  expect(resistanceCue(s)).toBeNull();
});

test('PB when distance beats history max', () => {
  const s = { ...startSession(null), elapsed: 60, distanceKm: 20, calories: 300, rpmSum: 5400, rpmN: 60 };
  const sum = buildSummary(s, [{ id: 'x', name: 'x', when: 'MON', min: 30, km: 16.1, kcal: 400, date: '' }]);
  expect(sum.pb).toBe(true); expect(sum.avgRpm).toBe(90);
});
