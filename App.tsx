import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
} from '@expo-google-fonts/barlow-condensed';
import { RootNavigator } from './src/navigation/RootNavigator';
import { USE_SIMULATED } from './src/config';
import { useHistory } from './src/store/historyStore';
import { useSettings } from './src/store/settingsStore';
import { useBike } from './src/store/bikeStore';
import { SimulatedBikeSource } from './src/ble/SimulatedBikeSource';
import { FtmsBikeSource } from './src/ble/FtmsBikeSource';

// Hold the native splash until fonts + store hydration are ready.
SplashScreen.preventAutoHideAsync();

/**
 * App entry — loads Barlow Condensed, hydrates stores, selects the bike source
 * (real FTMS by default; SimulatedBikeSource when USE_SIMULATED), then mounts
 * the store-state-driven RootNavigator.
 */
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // setSource must run first so the onState subscription exists; a successful
        // reconnect flips conn to 'connected' and RootNavigator skips the Connect screen.
        // Do it before the awaits below so the source is wired even if hydration throws.
        useBike.getState().setSource(
          USE_SIMULATED ? new SimulatedBikeSource() : new FtmsBikeSource(),
        );
        await Promise.all([
          useHistory.getState().hydrate(),
          useSettings.getState().hydrate(),
        ]);
        await useBike.getState().attemptReconnect();
      } finally {
        // ALWAYS flip hydrated so the splash can hide and RootNavigator renders,
        // even if hydration/reconnect throws (corrupt storage, etc.) — the stores
        // fall back to seed/defaults in that case.
        setHydrated(true);
      }
    })();
  }, []);

  // A font-load failure degrades to the system font instead of hanging on the splash.
  const ready = (fontsLoaded || !!fontError) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null; // keep splash visible

  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  );
}
