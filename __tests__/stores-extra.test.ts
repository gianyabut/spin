jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import { useBike } from '../src/store/bikeStore';
import { useSettings } from '../src/store/settingsStore';
import { USE_SIMULATED } from '../src/config';
import type { BikeSource, BikeReading, ConnState, DiscoveredDevice, Unsubscribe } from '../src/ble/BikeSource';

const noop: Unsubscribe = () => {};
const fake = (): BikeSource => ({
  capabilities: { control: false },
  getState: () => 'connected' as ConnState,
  scan: (_cb: (d: DiscoveredDevice) => void) => noop,
  connect: async () => {},
  disconnect: async () => {},
  onData: (_cb: (r: BikeReading) => void) => noop,
  onState: (_cb: (s: ConnState) => void) => noop,
  setResistance: () => Promise.resolve(),
});

test('config exposes a boolean simulation toggle', () => {
  expect(typeof USE_SIMULATED).toBe('boolean');
});

test('settings hydrate loads defaults; setLastDevice persists', async () => {
  await useSettings.getState().hydrate();
  expect(useSettings.getState().units).toBe('km');
  expect(useSettings.getState().weeklyGoalKm).toBe(60);
  useSettings.getState().setLastDevice('dev-abc');
  expect(useSettings.getState().lastDeviceId).toBe('dev-abc');
  useSettings.getState().setLastDevice(null);
});

test('resDec / setPaused / clearSummary drive the session', () => {
  useBike.getState().setSource(fake());
  useBike.getState().startRide(null); // free ride, resistance starts at 8
  expect(useBike.getState().session!.resistance).toBe(8);

  useBike.getState().resDec();
  expect(useBike.getState().session!.resistance).toBe(7);

  useBike.getState().setPaused();
  expect(useBike.getState().session!.paused).toBe(true);
  useBike.getState().setPaused();
  expect(useBike.getState().session!.paused).toBe(false);

  useBike.getState().endRide();
  expect(useBike.getState().summary).not.toBeNull();
  useBike.getState().clearSummary();
  expect(useBike.getState().summary).toBeNull();
});
