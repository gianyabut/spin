jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../src/screens/HomeScreen';
import { useBike } from '../src/store/bikeStore';
import { useHistory } from '../src/store/historyStore';
import { PROGRAMS } from '../src/engine/programs';

// RTL v14 no longer returns bound queries from render(); use the `screen` object.
// These tests mutate useBike.conn → reset it in afterEach so it never bleeds.
afterEach(() => useBike.setState({ conn: 'idle' }));

test('connected: renders greeting + START RIDE + LAST RIDE meta; a program card starts that program', async () => {
  await useHistory.getState().hydrate(); // seeds rides so LAST RIDE row has data
  useBike.setState({ conn: 'connected' });

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
