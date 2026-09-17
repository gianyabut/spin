jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { RidesScreen } from '../src/screens/RidesScreen';
import { useHistory } from '../src/store/historyStore';

// RTL v14 no longer returns bound queries from render(); use the `screen` object.

test('history-first: header count + total, month group, and every ride with its distance', async () => {
  await useHistory.getState().hydrate(); // 3 seeded rides, all Aug 2026, sum km = 42.1

  render(<RidesScreen />);

  await waitFor(() => screen.getByText('YOUR RIDES'));
  screen.getByText('3 RIDES · 42 KM TOTAL'); // count + rounded total in km
  screen.getByText('AUGUST 2026'); // month group from ride dates (not the current month)

  // All three rides render (names uppercased) with their distances.
  screen.getByText('HIIT 30');
  screen.getByText('FREE RIDE');
  screen.getByText('ENDURANCE 45');
  screen.getByText('11.2 KM');
  screen.getByText('14.8 KM');
  screen.getByText('16.1 KM');
});

test('FREE filter shows only free rides; PROGRAMS shows only program rides', async () => {
  await useHistory.getState().hydrate();
  render(<RidesScreen />);
  await waitFor(() => screen.getByText('HIIT 30'));

  await act(async () => { fireEvent.press(screen.getByText('FREE')); });
  screen.getByText('FREE RIDE');
  expect(screen.queryByText('HIIT 30')).toBeNull();

  await act(async () => { fireEvent.press(screen.getByText('PROGRAMS')); });
  screen.getByText('HIIT 30');
  screen.getByText('ENDURANCE 45');
  expect(screen.queryByText('FREE RIDE')).toBeNull();
});

test('empty history shows the NO RIDES YET state', async () => {
  useHistory.setState({ rides: [] });
  render(<RidesScreen />);
  await waitFor(() => screen.getByText('NO RIDES YET'));
  screen.getByText('0 RIDES · 0 KM TOTAL');
});
