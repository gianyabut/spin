jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react-native';
import { RootNavigator } from '../src/navigation/RootNavigator';
import { useBike } from '../src/store/bikeStore';
import { useHistory } from '../src/store/historyStore';
import { startSession } from '../src/engine/rideEngine';

// RTL v14 no longer returns bound queries from render(); use the `screen` object.
// This suite mutates the shared useBike/useHistory stores → reset both slices
// in before/afterEach so it never bleeds across suites.
const TABS = ['HOME', 'RIDES', 'PROGRAMS', 'PROFILE'];

beforeEach(() => {
  useBike.setState({ conn: 'connected', session: null, summary: null });
  useHistory.setState({ rides: [] });
});
afterEach(() => {
  useBike.setState({ conn: 'idle', session: null, summary: null });
});

test('connected + no session/summary → custom tab bar shows all four tabs', async () => {
  render(<RootNavigator />);
  await waitFor(() => screen.getByText('HOME'));
  TABS.forEach(label => screen.getByText(label));
});

test('a ride hides the tab bar entirely (LiveRide shown)', async () => {
  render(<RootNavigator />);
  await waitFor(() => screen.getByText('HOME')); // tabs present before the ride
  TABS.forEach(label => screen.getByText(label));

  // Set a session directly (no startRide → no 1s timer spins up).
  // The store update drives a synchronous RootNavigator re-render → wrap in act.
  await act(async () => {
    useBike.setState({ session: startSession(null) });
  });

  // Tab bar is hidden during a ride; LiveRide content shows instead.
  await waitFor(() => screen.getByText('FREE RIDE'));
  TABS.forEach(label => expect(screen.queryByText(label)).toBeNull());
});

test('disconnected + no session/summary → tabs are reachable (not trapped on Connect)', async () => {
  useBike.setState({ conn: 'idle' });
  render(<RootNavigator />);
  // The tab view shows even without a bike, so history/programs/profile are reachable.
  await waitFor(() => screen.getByText('HOME'));
  TABS.forEach(label => screen.getByText(label));
  // The Connect screen is NOT forced on top (its BACK affordance is absent).
  expect(screen.queryByText(/← BACK/)).toBeNull();
});

test('disconnected → tapping the connect status opens Connect, BACK returns to tabs', async () => {
  useBike.setState({ conn: 'idle' });
  render(<RootNavigator />);
  await waitFor(() => screen.getByText('HOME'));

  // Home's disconnected status opens Find-Your-Bike on demand.
  fireEvent.press(screen.getByText(/NOT CONNECTED/));
  await waitFor(() => screen.getByText(/← BACK/));
  TABS.forEach(label => expect(screen.queryByText(label)).toBeNull()); // full-screen Connect

  // BACK dismisses Connect and returns to the tab view.
  fireEvent.press(screen.getByText(/← BACK/));
  await waitFor(() => screen.getByText('HOME'));
});
