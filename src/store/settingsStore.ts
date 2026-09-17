import { create } from 'zustand';
import type { Settings, Units } from '../engine/types';
import { loadSettings, saveSettings } from '../persistence/repository';

const DEFAULTS: Settings = { name: '', units: 'km', weeklyGoalKm: 60, lastDeviceId: null };

type S = {
  name: string;
  units: Units;
  weeklyGoalKm: number;
  lastDeviceId: string | null;
  hydrate: () => Promise<void>;
  setName: (n: string) => void;
  setUnits: (u: Units) => void;
  setLastDevice: (id: string | null) => void;
};

// Snapshot the persistable Settings from current state so every setter writes
// the full object (name included) rather than a stale subset.
const persist = (get: () => S) => {
  const { name, units, weeklyGoalKm, lastDeviceId } = get();
  saveSettings({ name, units, weeklyGoalKm, lastDeviceId });
};

export const useSettings = create<S>((set, get) => ({
  name: DEFAULTS.name,
  units: DEFAULTS.units,
  weeklyGoalKm: DEFAULTS.weeklyGoalKm,
  lastDeviceId: DEFAULTS.lastDeviceId,
  hydrate: async () => {
    const s = await loadSettings();
    set({ name: s.name, units: s.units, weeklyGoalKm: s.weeklyGoalKm, lastDeviceId: s.lastDeviceId });
  },
  setName: (n) => { set({ name: n }); persist(get); },
  setUnits: (u) => { set({ units: u }); persist(get); },
  setLastDevice: (id) => { set({ lastDeviceId: id }); persist(get); },
}));
