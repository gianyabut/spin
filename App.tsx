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
  const [fontsLoaded] = useFonts({
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      await Promise.all([
        useHistory.getState().hydrate(),
        useSettings.getState().hydrate(),
      ]);
      useBike.getState().setSource(
        USE_SIMULATED ? new SimulatedBikeSource() : new FtmsBikeSource(),
      );
      setHydrated(true);
    })();
  }, []);

  const ready = fontsLoaded && hydrated;

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
