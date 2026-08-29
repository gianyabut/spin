jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../src/screens/HomeScreen';
import { useBike } from '../src/store/bikeStore';
import { useHistory } from '../src/store/historyStore';
import { PROGRAMS } from '../src/engine/programs';

// RTL v14 no longer returns bound queries from render(); use the `screen` object.
test('renders greeting + START RIDE + LAST RIDE meta; a program card starts that program', async () => {
  await useHistory.getState().hydrate(); // seeds rides so LAST RIDE row has data

  // Spy so pressing a card does not spin up the ride timer (keeps output pristine).
  const startSpy = jest.spyOn(useBike.getState(), 'startRide').mockImplementation(() => {});
  const onStartRide = jest.fn();
  render(<HomeScreen onStartRide={onStartRide} />);

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
