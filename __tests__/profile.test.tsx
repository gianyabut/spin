jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import { useHistory } from '../src/store/historyStore';
import { useSettings } from '../src/store/settingsStore';

// RTL v14 no longer returns bound queries from render(); use the `screen` object.
// setUnits/name mutate the shared useSettings store, so pin them before each run.
beforeEach(() => useSettings.setState({ units: 'km', name: 'Sam' }));
afterEach(() => useSettings.setState({ units: 'km', name: '' }));

test('shows the saved name uppercased; RIDER when unset', async () => {
  await useHistory.getState().hydrate();
  useSettings.setState({ name: 'Alex' });
  render(<ProfileScreen />);
  await waitFor(() => screen.getByText('ALEX'));

  await act(async () => { useSettings.setState({ name: '' }); });
  await waitFor(() => screen.getByText('RIDER'));
});

test('tapping the name opens an editor that saves via setName', async () => {
  await useHistory.getState().hydrate();
  useSettings.setState({ name: 'Alex' });
  const setNameSpy = jest.spyOn(useSettings.getState(), 'setName');
  render(<ProfileScreen />);

  await waitFor(() => screen.getByText('ALEX'));
  await act(async () => { fireEvent.press(screen.getByText('ALEX')); });
  await act(async () => { fireEvent.changeText(screen.getByTestId('profile-name-input'), 'Jordan'); });
  await act(async () => { fireEvent(screen.getByTestId('profile-name-input'), 'submitEditing'); });

  expect(setNameSpy).toHaveBeenCalledWith('Jordan');
  await waitFor(() => screen.getByText('JORDAN'));
  setNameSpy.mockRestore();
});

test('renders the 6-week distance trend (moved from Rides)', async () => {
  await useHistory.getState().hydrate();
  render(<ProfileScreen />);
  await waitFor(() => screen.getByText('DISTANCE · LAST 6 WEEKS'));
  screen.getByText('NOW'); // the current-week bar label
});

test('renders WEEKLY GOAL card with converted goal value from seeded history', async () => {
  await useHistory.getState().hydrate(); // seeds 3 rides (SEED_HISTORY), sum km = 42.1

  render(<ProfileScreen />);

  await waitFor(() => screen.getByText('WEEKLY GOAL'));

  // sum(11.2 + 14.8 + 16.1) = 42.1 km, goal 60 km, pct round(42.1/60*100)=70%.
  screen.getByText('42.1 / 60 KM'); // composed value + muted denominator span
  screen.getByText('/ 60 KM'); // the goal denominator span on its own
  screen.getByText('70%');
});

test('tapping the UNITS row flips the units label and the store units', async () => {
  await useHistory.getState().hydrate();

  render(<ProfileScreen />);

  await waitFor(() => screen.getByText('KILOMETERS'));
  expect(useSettings.getState().units).toBe('km');

  fireEvent.press(screen.getByTestId('units-row'));

  await waitFor(() => screen.getByText('MILES'));
  expect(useSettings.getState().units).toBe('mi');

  fireEvent.press(screen.getByTestId('units-row'));

  await waitFor(() => screen.getByText('KILOMETERS'));
  expect(useSettings.getState().units).toBe('km');
});
