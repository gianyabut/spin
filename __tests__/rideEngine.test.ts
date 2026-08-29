import { startSession, tick, togglePause, buildSummary, resCue } from '../src/engine/rideEngine';
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

test('resCue shows delta to interval target', () => {
  let s = startSession(PROGRAMS[0]); // seg0 res 8
  s = { ...s, resistance: 6 };
  expect(resCue(s)).toBe(' ▲2');
  s = { ...s, resistance: 11 };
  expect(resCue(s)).toBe(' ▼3');
});

test('PB when distance beats history max', () => {
  const s = { ...startSession(null), elapsed: 60, distanceKm: 20, calories: 300, rpmSum: 5400, rpmN: 60 };
  const sum = buildSummary(s, [{ id: 'x', name: 'x', when: 'MON', min: 30, km: 16.1, kcal: 400, date: '' }]);
  expect(sum.pb).toBe(true); expect(sum.avgRpm).toBe(90);
});
