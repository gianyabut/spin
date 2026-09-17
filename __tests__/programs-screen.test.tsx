jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ProgramsScreen } from '../src/screens/ProgramsScreen';
import { useBike } from '../src/store/bikeStore';
import { PROGRAMS } from '../src/engine/programs';

// RTL v14 no longer returns bound queries from render(); use the `screen` object.
afterEach(() => useBike.setState({ conn: 'idle' }));

test('connected: renders all 3 program names; pressing a START starts that program + navigates', async () => {
  useBike.setState({ conn: 'connected' });
  // Spy so pressing START does not spin up the ride timer (keeps output pristine).
  const startSpy = jest.spyOn(useBike.getState(), 'startRide').mockImplementation(() => {});
  const onStartRide = jest.fn();
  render(<ProgramsScreen onStartRide={onStartRide} onRequestConnect={jest.fn()} />);

  await waitFor(() => screen.getByText('PROGRAMS'));

  // All 3 program names render.
  screen.getByText('HIIT 30');
  screen.getByText('ENDURANCE 45');
  screen.getByText('PYRAMID 20');

  // Each card has a START button; press the first one → startRide(that program) + onStartRide.
  const starts = screen.getAllByText('START');
  expect(starts.length).toBe(3);

  fireEvent.press(starts[0]);
  expect(startSpy).toHaveBeenCalledWith(PROGRAMS[0]);
  expect(onStartRide).toHaveBeenCalledTimes(1);

  startSpy.mockRestore();
});

test('disconnected: pressing START opens Connect instead of starting the program', async () => {
  useBike.setState({ conn: 'idle' });
  const startSpy = jest.spyOn(useBike.getState(), 'startRide').mockImplementation(() => {});
  const onStartRide = jest.fn();
  const onRequestConnect = jest.fn();
  render(<ProgramsScreen onStartRide={onStartRide} onRequestConnect={onRequestConnect} />);

  await waitFor(() => screen.getByText('PROGRAMS'));
  fireEvent.press(screen.getAllByText('START')[0]);

  expect(onRequestConnect).toHaveBeenCalledTimes(1);
  expect(startSpy).not.toHaveBeenCalled();
  expect(onStartRide).not.toHaveBeenCalled();

  startSpy.mockRestore();
});
