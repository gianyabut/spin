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
