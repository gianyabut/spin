jest.mock('@react-native-async-storage/async-storage', () => ({ setItem:()=>Promise.resolve(), getItem:()=>Promise.resolve(null) }));
import { useBike } from '../src/store/bikeStore';
import { useSettings } from '../src/store/settingsStore';
import { SimulatedBikeSource } from '../src/ble/SimulatedBikeSource';

beforeEach(() => {
  useBike.setState({ conn: 'idle' });
  useSettings.setState({ lastDeviceId: null });
});
afterEach(async () => {
  await useBike.getState().source.disconnect(); // stop the sim's data interval so jest exits cleanly
});

test('attemptReconnect connects when a lastDeviceId is stored', async () => {
  useBike.getState().setSource(new SimulatedBikeSource());
  useSettings.getState().setLastDevice('sim');
  await useBike.getState().attemptReconnect();
  expect(useBike.getState().conn).toBe('connected');
});

test('attemptReconnect does nothing when no lastDeviceId is stored', async () => {
  useBike.getState().setSource(new SimulatedBikeSource());
  useSettings.setState({ lastDeviceId: null });
  await useBike.getState().attemptReconnect();
  expect(useBike.getState().conn).toBe('idle');
});
