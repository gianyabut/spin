import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { ConnectScreen } from '../src/screens/ConnectScreen';
import { SimulatedBikeSource } from '../src/ble/SimulatedBikeSource';

// RTL v14 no longer returns bound queries from render(); use the `screen` object.
test('shows discovered device then connects', async () => {
  const src = new SimulatedBikeSource();
  const onConnected = jest.fn();
  render(<ConnectScreen source={src} onConnected={onConnected} />);
  await waitFor(() => screen.getByText('YESOUL S3-4F2A'));
  fireEvent.press(screen.getByText('CONNECT'));
  await waitFor(() => expect(onConnected).toHaveBeenCalled());
  await src.disconnect(); // stop the sim's data interval so jest exits cleanly
});
