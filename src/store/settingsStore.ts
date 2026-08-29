import { create } from 'zustand';
import type { Settings, Units } from '../engine/types';
import { loadSettings, saveSettings } from '../persistence/repository';

const DEFAULTS: Settings = { units: 'km', weeklyGoalKm: 60, lastDeviceId: null };

type S = {
  units: Units;
  weeklyGoalKm: number;
  lastDeviceId: string | null;
  hydrate: () => Promise<void>;
  setUnits: (u: Units) => void;
  setLastDevice: (id: string | null) => void;
};
export const useSettings = create<S>((set, get) => ({
  units: DEFAULTS.units,
  weeklyGoalKm: DEFAULTS.weeklyGoalKm,
  lastDeviceId: DEFAULTS.lastDeviceId,
  hydrate: async () => {
    const s = await loadSettings();
    set({ units: s.units, weeklyGoalKm: s.weeklyGoalKm, lastDeviceId: s.lastDeviceId });
  },
  setUnits: (u) => {
    set({ units: u });
    const { units, weeklyGoalKm, lastDeviceId } = get();
    saveSettings({ units, weeklyGoalKm, lastDeviceId });
  },
  setLastDevice: (id) => {
    set({ lastDeviceId: id });
    const { units, weeklyGoalKm, lastDeviceId } = get();
    saveSettings({ units, weeklyGoalKm, lastDeviceId });
  },
}));
