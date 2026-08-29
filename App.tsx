import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';

/**
 * App entry — mounts the store-state-driven RootNavigator.
 * Full store hydration, font loading, and source selection are wired in
 * Task 6.1; this task keeps App.tsx minimal so the app renders end-to-end.
 */
export default function App() {
  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}
