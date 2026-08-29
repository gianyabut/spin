import { create } from 'zustand';
import type { Ride } from '../engine/types';
import { SEED_HISTORY } from '../engine/programs';
import { loadHistory, saveHistory } from '../persistence/repository';

type S = {
  rides: Ride[];
  hydrate: () => Promise<void>;
  addRide: (r: Ride) => void;
  maxKm: () => number;
  monthStats: () => { km: number; rides: number; hours: number };
};
export const useHistory = create<S>((set, get) => ({
  rides: [],
  hydrate: async () => set({ rides: (await loadHistory()) ?? SEED_HISTORY }),
  addRide: (r) => { const rides = [r, ...get().rides]; set({ rides }); saveHistory(rides); },
  maxKm: () => Math.max(0, ...get().rides.map(r => r.km)),
  // Prototype presented aggregate month figures with baked-in offsets; keep the same display math.
  monthStats: () => {
    const rs = get().rides;
    return { km: Math.round(rs.reduce((a, r) => a + r.km, 0) + 144),
      rides: rs.length + 14,
      hours: +(((rs.reduce((a, r) => a + r.min, 0) + 430) / 60).toFixed(1)) };
  },
}));
