jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import { LiveRideScreen } from '../src/screens/LiveRideScreen';
import { useBike } from '../src/store/bikeStore';
import { SimulatedBikeSource } from '../src/ble/SimulatedBikeSource';

// RTL v14 no longer returns bound queries from render(); use the `screen` object.
test('renders cadence and metric labels during a ride', async () => {
  const src = new SimulatedBikeSource();
  await src.connect('sim');
  useBike.getState().setSource(src);
  useBike.getState().startRide(null);

  render(<LiveRideScreen onEnd={() => {}} />);
  await waitFor(() => screen.getByText('KCAL'));
  screen.getByText('FREE RIDE');
  screen.getByText('RPM · FIND YOUR RHYTHM');

  // Test hygiene: stop the store's 1s timer + the sim's data interval so no
  // open handles leak (output stays pristine — no "did not exit" warning).
  useBike.getState().endRide();
  await src.disconnect();
});
