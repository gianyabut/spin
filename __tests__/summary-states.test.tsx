jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { SummaryScreen } from '../src/screens/SummaryScreen';
import { useBike } from '../src/store/bikeStore';

test('a non-PB ride hides the chip and the previous-best line', async () => {
  useBike.setState({ summary: { name: 'Free ride', sec: 600, km: 5, kcal: 100, avgRpm: 80, pb: false } });
  render(<SummaryScreen onDone={() => {}} />);
  await waitFor(() => screen.getByText('RIDE'));
  expect(screen.queryByText('★ NEW DISTANCE PB')).toBeNull();
  expect(screen.queryByText(/PREVIOUS BEST/)).toBeNull();
});

test('a PB ride shows the previous best struck through and the +delta', async () => {
  useBike.setState({ summary: { name: 'HIIT 30', sec: 1800, km: 13.1, kcal: 356, avgRpm: 88, pb: true, prevBestKm: 12.4 } });
  render(<SummaryScreen onDone={() => {}} />);
  await waitFor(() => screen.getByText('★ NEW DISTANCE PB'));
  screen.getByText(/PREVIOUS BEST 12\.4 KM/);
  screen.getByText(/▲ \+0\.7 KM/);
});
