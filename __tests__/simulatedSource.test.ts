import { SimulatedBikeSource } from '../src/ble/SimulatedBikeSource';

test('scan reports a simulated device then connect flips state to connected', async () => {
  const s = new SimulatedBikeSource();
  const found: string[] = [];
  s.scan(d => found.push(d.name));
  await new Promise(r => setTimeout(r, 20));
  expect(found[0]).toMatch(/YESOUL/i);
  await s.connect('sim');
  expect(s.getState()).toBe('connected');
});

test('emits readings that ease toward the set target', async () => {
  const s = new SimulatedBikeSource();
  await s.connect('sim');
  s.setTarget(90);
  const readings: number[] = [];
  s.onData(r => readings.push(r.cadence));
  await new Promise(r => setTimeout(r, 120)); // a few ticks (tick=30ms in test mode)
  expect(readings.length).toBeGreaterThan(1);
  expect(readings[readings.length - 1]).toBeGreaterThan(readings[0]);
});
