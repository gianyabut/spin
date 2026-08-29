jest.mock('@react-native-async-storage/async-storage', () => ({ setItem:()=>Promise.resolve(), getItem:()=>Promise.resolve(null) }));
import { useBike } from '../src/store/bikeStore';
import { SimulatedBikeSource } from '../src/ble/SimulatedBikeSource';

test('startRide then ticks accumulate elapsed', async () => {
  const src = new SimulatedBikeSource(); await src.connect('sim');
  useBike.getState().setSource(src);
  useBike.getState().startRide(null);
  await new Promise(r => setTimeout(r, 1100)); // >1 engine second
  expect(useBike.getState().session!.elapsed).toBeGreaterThanOrEqual(1);
  useBike.getState().endRide();
  expect(useBike.getState().summary).not.toBeNull();
  await src.disconnect(); // stop the sim's data interval so jest exits cleanly
});

test('double startRide leaves no stray timer; double endRide preserves summary', async () => {
  const src = new SimulatedBikeSource(); await src.connect('sim');
  useBike.getState().setSource(src);
  useBike.getState().startRide(null);
  useBike.getState().startRide(null); // second start must tear down the first timer/sub
  await new Promise(r => setTimeout(r, 1100)); // >1 engine second
  const elapsed = useBike.getState().session!.elapsed;
  // one wall-second must advance elapsed by ~1, not ~2 (which two racing timers would cause)
  expect(elapsed).toBeGreaterThanOrEqual(1);
  expect(elapsed).toBeLessThan(2);
  useBike.getState().endRide();
  expect(useBike.getState().session).toBeNull();
  const summary = useBike.getState().summary;
  expect(summary).not.toBeNull();
  useBike.getState().endRide(); // redundant END must not blank the built summary
  expect(useBike.getState().summary).toBe(summary);
  await src.disconnect(); // stop the sim's data interval so jest exits cleanly
});
