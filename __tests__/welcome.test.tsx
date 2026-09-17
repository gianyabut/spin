jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: () => Promise.resolve(), getItem: () => Promise.resolve(null) }));
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { WelcomeScreen } from '../src/screens/WelcomeScreen';
import { useSettings } from '../src/store/settingsStore';

// RTL v14 no longer returns bound queries from render(); use the `screen` object.
afterEach(() => useSettings.setState({ name: '' }));

test('entering a name and pressing LET\'S RIDE saves the trimmed name and finishes', async () => {
  const setNameSpy = jest.spyOn(useSettings.getState(), 'setName');
  const onDone = jest.fn();
  render(<WelcomeScreen onDone={onDone} />);

  await waitFor(() => screen.getByText(/YOUR NAME\?/));
  await act(async () => { fireEvent.changeText(screen.getByTestId('name-input'), '  Sam  '); });
  await act(async () => { fireEvent.press(screen.getByText(/LET'S RIDE/)); });

  expect(onDone).toHaveBeenCalledTimes(1);
  expect(setNameSpy).toHaveBeenCalledWith('Sam'); // trimmed
  setNameSpy.mockRestore();
});

test('SKIP finishes without saving a name (stays empty → RIDER fallback)', async () => {
  const setNameSpy = jest.spyOn(useSettings.getState(), 'setName');
  const onDone = jest.fn();
  render(<WelcomeScreen onDone={onDone} />);

  await waitFor(() => screen.getByText('SKIP'));
  fireEvent.press(screen.getByText('SKIP'));

  await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  expect(setNameSpy).not.toHaveBeenCalled();
  expect(useSettings.getState().name).toBe('');
  setNameSpy.mockRestore();
});

test('pressing LET\'S RIDE with no name entered just finishes (acts as skip)', async () => {
  const setNameSpy = jest.spyOn(useSettings.getState(), 'setName');
  const onDone = jest.fn();
  render(<WelcomeScreen onDone={onDone} />);

  await waitFor(() => screen.getByText(/LET'S RIDE/));
  fireEvent.press(screen.getByText(/LET'S RIDE/));

  await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
  expect(setNameSpy).not.toHaveBeenCalled(); // nothing to save
  setNameSpy.mockRestore();
});
