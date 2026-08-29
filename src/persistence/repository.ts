import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Ride, Settings } from '../engine/types';
const K = { settings: 'pulse.settings', history: 'pulse.history' };
const DEFAULTS: Settings = { units: 'km', weeklyGoalKm: 60, lastDeviceId: null };
export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(K.settings);
  if (!raw) return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    // Corrupt persisted settings → fall back to defaults instead of throwing,
    // so bootstrap can never hang on the splash.
    return DEFAULTS;
  }
}
export const saveSettings = (s: Settings) => AsyncStorage.setItem(K.settings, JSON.stringify(s));
export async function loadHistory(): Promise<Ride[] | null> {
  const raw = await AsyncStorage.getItem(K.history);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // Corrupt persisted history → treat as no history (seed fallback) rather than throw.
    return null;
  }
}
export const saveHistory = (rides: Ride[]) => AsyncStorage.setItem(K.history, JSON.stringify(rides));
