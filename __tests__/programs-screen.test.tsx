jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ProgramsScreen } from '../src/screens/ProgramsScreen';
import { useBike } from '../src/store/bikeStore';
import { PROGRAMS } from '../src/engine/programs';

// RTL v14 no longer returns bound queries from render(); use the `screen` object.
test('renders all 3 program names; pressing a START starts that program + navigates', async () => {
  // Spy so pressing START does not spin up the ride timer (keeps output pristine).
  const startSpy = jest.spyOn(useBike.getState(), 'startRide').mockImplementation(() => {});
  const onStartRide = jest.fn();
  render(<ProgramsScreen onStartRide={onStartRide} />);

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
