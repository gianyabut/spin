jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { HomeScreen } from '../src/screens/HomeScreen';
import { useBike } from '../src/store/bikeStore';
import { useHistory } from '../src/store/historyStore';
import { useSettings } from '../src/store/settingsStore';
import { PROGRAMS } from '../src/engine/programs';

// RTL v14 no longer returns bound queries from render(); use the `screen` object.
// These tests mutate useBike.conn / useSettings.name → reset in afterEach.
afterEach(() => { useBike.setState({ conn: 'idle' }); useSettings.setState({ name: '' }); });

test('greeting uses the saved name; falls back to RIDER when unset', async () => {
  useBike.setState({ conn: 'connected' });
  useSettings.setState({ name: 'Alex' });
  render(<HomeScreen onStartRide={jest.fn()} onRequestConnect={jest.fn()} />);
  await waitFor(() => screen.getByText(/^(MORNING|AFTERNOON|EVENING), ALEX$/));

  // Home reads name reactively from the store — clearing it re-renders to RIDER.
  await act(async () => { useSettings.setState({ name: '' }); });
  await waitFor(() => screen.getByText(/^(MORNING|AFTERNOON|EVENING), RIDER$/));
});

test('header avatar shows the name initial (not a hardcoded S)', async () => {
  useBike.setState({ conn: 'connected' });
  useSettings.setState({ name: 'Alex' });
  render(<HomeScreen onStartRide={jest.fn()} onRequestConnect={jest.fn()} />);
  await waitFor(() => expect(screen.getByTestId('home-avatar').props.children).toBe('A'));

  await act(async () => { useSettings.setState({ name: '' }); }); // fallback RIDER → R
  await waitFor(() => expect(screen.getByTestId('home-avatar').props.children).toBe('R'));
});

test('connected: renders greeting + START RIDE + LAST RIDE meta; a program card starts that program', async () => {
  await useHistory.getState().hydrate(); // seeds rides so LAST RIDE row has data
  useBike.setState({ conn: 'connected' });
  useSettings.setState({ name: 'Sam' });

  // Spy so pressing a card does not spin up the ride timer (keeps output pristine).
  const startSpy = jest.spyOn(useBike.getState(), 'startRide').mockImplementation(() => {});
  const onStartRide = jest.fn();
  render(<HomeScreen onStartRide={onStartRide} onRequestConnect={jest.fn()} />);

  // Greeting is time-of-day dependent — accept whichever is correct at run time.
  await waitFor(() => screen.getByText(/^(MORNING|AFTERNOON|EVENING), SAM$/));
  screen.getByText('START RIDE');
  screen.getByText(/11\.2 KM · 30 MIN · 341 KCAL/); // rides[0] from SEED_HISTORY

  // First program card → startRide(that program) + onStartRide.
  fireEvent.press(screen.getByText(PROGRAMS[0].name));
  expect(startSpy).toHaveBeenCalledWith(PROGRAMS[0]);
  expect(onStartRide).toHaveBeenCalledTimes(1);

  startSpy.mockRestore();
});

test('disconnected: START becomes CONNECT TO RIDE and opens Connect instead of starting a ride', async () => {
  useBike.setState({ conn: 'idle' });

  const startSpy = jest.spyOn(useBike.getState(), 'startRide').mockImplementation(() => {});
  const onStartRide = jest.fn();
  const onRequestConnect = jest.fn();
  render(<HomeScreen onStartRide={onStartRide} onRequestConnect={onRequestConnect} />);

  await waitFor(() => screen.getByText(/NOT CONNECTED/));
  fireEvent.press(screen.getByText(/CONNECT TO RIDE/));

  expect(onRequestConnect).toHaveBeenCalledTimes(1);
  expect(startSpy).not.toHaveBeenCalled();
  expect(onStartRide).not.toHaveBeenCalled();

  startSpy.mockRestore();
});

test('disconnected: pressing a program row opens Connect instead of starting it', async () => {
  useBike.setState({ conn: 'idle' });

  const startSpy = jest.spyOn(useBike.getState(), 'startRide').mockImplementation(() => {});
  const onRequestConnect = jest.fn();
  render(<HomeScreen onStartRide={jest.fn()} onRequestConnect={onRequestConnect} />);

  await waitFor(() => screen.getByText(PROGRAMS[0].name));
  fireEvent.press(screen.getByText(PROGRAMS[0].name));

  expect(onRequestConnect).toHaveBeenCalledTimes(1);
  expect(startSpy).not.toHaveBeenCalled();

  startSpy.mockRestore();
});
