jest.mock('@react-native-async-storage/async-storage', () => ({ setItem:()=>Promise.resolve(), getItem:()=>Promise.resolve(null) }));
import { useBike } from '../src/store/bikeStore';
import { SimulatedBikeSource } from '../src/ble/SimulatedBikeSource';
import type { BikeSource, BikeReading, ConnState, DiscoveredDevice, Unsubscribe } from '../src/ble/BikeSource';

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

// Task 6.3 — resistance writes gated on capabilities.control.
test('resInc writes to a control-capable bike (setResistance called with the new level)', async () => {
  const src = new SimulatedBikeSource(); // capabilities.control === true
  await src.connect('sim');
  const spy = jest.spyOn(src, 'setResistance');
  useBike.getState().setSource(src);
  useBike.getState().startRide(null); // free ride → resistance starts at 8
  spy.mockClear(); // startRide/tick may have called it; isolate the resInc write

  useBike.getState().resInc();
  expect(useBike.getState().session!.resistance).toBe(9); // local target still advances
  expect(spy).toHaveBeenCalledWith(9); // and the bike is told the new level

  useBike.getState().endRide();
  await src.disconnect();
  spy.mockRestore();
});

test('resInc does NOT write to a read-only bike (control:false) but still advances the local target', () => {
  const setResSpy = jest.fn(() => Promise.resolve());
  const noop: Unsubscribe = () => {};
  const fake: BikeSource = {
    capabilities: { control: false },
    getState: () => 'connected' as ConnState,
    scan: (_cb: (d: DiscoveredDevice) => void) => noop,
    connect: async () => {},
    disconnect: async () => {},
    onData: (_cb: (r: BikeReading) => void) => noop,
    onState: (_cb: (s: ConnState) => void) => noop,
    setResistance: setResSpy,
  };
  useBike.getState().setSource(fake);
  useBike.getState().startRide(null); // free ride → resistance starts at 8

  useBike.getState().resInc();
  expect(useBike.getState().session!.resistance).toBe(9); // ▲/▼ cue still updates
  expect(setResSpy).not.toHaveBeenCalled(); // but no write to a read-only bike

  useBike.getState().endRide();
});
