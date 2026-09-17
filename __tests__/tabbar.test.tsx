import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { TabBar } from '../src/navigation/TabBar';

// RTL v14 no longer returns bound queries from render(); use the `screen` object,
// and await the first query (the tree commits a tick after render).

test('renders all four tabs (by testID) and marks the active one selected', async () => {
  render(<TabBar active="home" onSelect={() => {}} />);
  await waitFor(() => screen.getByTestId('tab-bar'));
  ['home', 'rides', 'programs', 'profile'].forEach(k => screen.getByTestId(`tab-${k}`));
  expect(screen.getByTestId('tab-home').props.accessibilityState.selected).toBe(true);
  expect(screen.getByTestId('tab-rides').props.accessibilityState.selected).toBe(false);
});

test('pressing a tab calls onSelect with its key', async () => {
  const onSelect = jest.fn();
  render(<TabBar active="home" onSelect={onSelect} />);
  await waitFor(() => screen.getByTestId('tab-programs'));
  fireEvent.press(screen.getByTestId('tab-programs'));
  expect(onSelect).toHaveBeenCalledWith('programs');
});

test('each tab exposes an accessibility label for the screen name', async () => {
  render(<TabBar active="home" onSelect={() => {}} />);
  await waitFor(() => screen.getByTestId('tab-rides'));
  expect(screen.getByTestId('tab-rides').props.accessibilityLabel).toBe('RIDES');
});
