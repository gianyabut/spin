import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Ride, Settings } from '../engine/types';
const K = { settings: 'pulse.settings', history: 'pulse.history' };
const DEFAULTS: Settings = { units: 'km', weeklyGoalKm: 60, lastDeviceId: null };
export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(K.settings);
  return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
}
export const saveSettings = (s: Settings) => AsyncStorage.setItem(K.settings, JSON.stringify(s));
export async function loadHistory(): Promise<Ride[] | null> {
  const raw = await AsyncStorage.getItem(K.history); return raw ? JSON.parse(raw) : null;
}
export const saveHistory = (rides: Ride[]) => AsyncStorage.setItem(K.history, JSON.stringify(rides));
