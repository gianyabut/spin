jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { RidesScreen } from '../src/screens/RidesScreen';
import { useHistory } from '../src/store/historyStore';

// RTL v14 no longer returns bound queries from render(); use the `screen` object.
test('renders YOUR RIDES + current month, month stats, and a seeded ride with its km', async () => {
  await useHistory.getState().hydrate(); // seeds 3 rides (SEED_HISTORY)

  render(<RidesScreen />);

  await waitFor(() => screen.getByText('YOUR RIDES'));

  // Month label mirrors the prototype: "<MONTH> <YEAR>" from the current date.
  const now = new Date();
  const label = `${now.toLocaleString('en-US', { month: 'long' }).toUpperCase()} ${now.getFullYear()}`;
  screen.getByText(label);

  // Seeded ride HIIT 30 + its distance under default km units (convDist is identity).
  screen.getByText('HIIT 30');
  screen.getByText('11.2 KM'); // rides[0] from SEED_HISTORY, right-aligned accent value

  // A monthStats value — HOURS = ((116 + 430) / 60).toFixed(1) = "9.1" (baked-in +430 offset).
  screen.getByText('9.1');
});
