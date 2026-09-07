jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, waitFor, screen, fireEvent } from '@testing-library/react-native';
import { LiveRideScreen } from '../src/screens/LiveRideScreen';
import { useBike } from '../src/store/bikeStore';
import { useHistory } from '../src/store/historyStore';
import { SimulatedBikeSource } from '../src/ble/SimulatedBikeSource';
import { PROGRAMS } from '../src/engine/programs';

test('program ride shows phase banner + ghost-race strip; PAUSE toggles to PAUSED', async () => {
  await useHistory.getState().hydrate(); // seeds a HIIT 30 ride → PB exists to race
  const src = new SimulatedBikeSource();
  await src.connect('sim');
  useBike.getState().setSource(src);
  useBike.getState().startRide(PROGRAMS[0]); // HIIT 30

  render(<LiveRideScreen onEnd={() => {}} />);
  await waitFor(() => screen.getByText('KCAL'));

  screen.getByText('HIIT 30 · INTERVAL 1/18'); // program header
  screen.getByText('WARM UP');                  // first segment phase banner
  screen.getByText(/RACING YOUR BEST · HIIT 30/); // ghost-race strip

  fireEvent.press(screen.getByText('PAUSE'));
  await waitFor(() => screen.getByText('PAUSED'));
  screen.getByText('RESUME');

  useBike.getState().endRide();
  await src.disconnect();
});
