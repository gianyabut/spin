jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { SummaryScreen } from '../src/screens/SummaryScreen';
import { useBike } from '../src/store/bikeStore';
import { useHistory } from '../src/store/historyStore';
import type { Summary } from '../src/engine/types';

// RTL v14 no longer returns bound queries from render(); use the `screen` object.
test('renders RIDE COMPLETE + distance, and DONE saves the ride to history', async () => {
  const summary: Summary = { name: 'HIIT 30', sec: 125, km: 4.2, kcal: 88, avgRpm: 91, pb: true };
  useBike.setState({ summary });

  const before = useHistory.getState().rides.length;
  const onDone = jest.fn();
  render(<SummaryScreen onDone={onDone} />);

  await waitFor(() => screen.getByText('RIDE'));   // title split across two lines: RIDE / COMPLETE
  screen.getByText('COMPLETE');
  screen.getByText(/^4\.2/);                        // distance hero (shares node with unit: "4.2 KM")
  screen.getByText('★ NEW DISTANCE PB');

  fireEvent.press(screen.getByText('DONE'));

  const after = useHistory.getState().rides;
  expect(after.length).toBe(before + 1);
  expect(after[0].name).toBe('HIIT 30');
  expect(after[0].km).toBe(4.2);
  expect(after[0].min).toBe(2);                     // Math.round(125/60)
  expect(onDone).toHaveBeenCalledTimes(1);
  expect(useBike.getState().summary).toBeNull();
});
