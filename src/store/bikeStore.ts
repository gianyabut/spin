import { create } from 'zustand';
import type { BikeSource, BikeReading, ConnState } from '../ble/BikeSource';
import { SimulatedBikeSource } from '../ble/SimulatedBikeSource';
import type { Program, Session, Summary } from '../engine/types';
import { startSession, tick, togglePause, currentSegment, buildSummary } from '../engine/rideEngine';
import { useHistory } from './historyStore';
import { useSettings } from './settingsStore';

type S = {
  source: BikeSource; conn: ConnState; session: Session | null; summary: Summary | null;
  _latest: BikeReading; _timer: any; _unsub: (() => void) | null;
  setSource: (src: BikeSource) => void;
  attemptReconnect: () => Promise<void>;
  startRide: (p: Program | null) => void;
  endRide: () => void;
  setPaused: () => void;
  resInc: () => void; resDec: () => void;
  clearSummary: () => void;
};
// Adjust the local resistance target (clamped 1..32) and, only when the source
// reports control capability, forward the new level to the bike. On a read-only
// source (capabilities.control === false) we still move the local target so the
// ▲/▼ cue updates, but never write to the hardware. Bike-write is fire-and-forget;
// a rejected Promise is swallowed so the action can't crash. (Task 6.3)
function setResistanceLevel(get: () => S, set: (p: Partial<S>) => void, delta: 1 | -1) {
  const st = get();
  if (!st.session) return;
  const next = delta > 0
    ? Math.min(32, st.session.resistance + 1)
    : Math.max(1, st.session.resistance - 1);
  set({ session: { ...st.session, resistance: next } });
  const src = get().source;
  if (src.capabilities.control && src.setResistance) {
    src.setResistance(next)?.catch(() => {});
  }
}

export const useBike = create<S>((set, get) => ({
  source: new SimulatedBikeSource(), conn: 'idle', session: null, summary: null,
  _latest: { cadence: 0, ts: 0 }, _timer: null, _unsub: null,
  setSource: (src) => { set({ source: src }); src.onState(conn => set({ conn })); },
  attemptReconnect: async () => {
    const lastDeviceId = useSettings.getState().lastDeviceId;
    if (!lastDeviceId) return; // nothing stored → leave conn idle so the Connect scan shows
    try {
      // On success the source's onState (subscribed in setSource) flips conn to 'connected'.
      await get().source.connect(lastDeviceId);
    } catch {
      // Swallow: leave conn idle/error so the app falls back to the Connect scan.
    }
  },
  startRide: (program) => {
    const prev = get(); if (prev._timer) clearInterval(prev._timer); prev._unsub?.();
    const src = get().source;
    const unsub = src.onData(r => set({ _latest: r }));
    // Reset _latest so the new ride's first tick can't consume a stale reading
    // from the prior ride (or the initial seed).
    set({ session: startSession(program), summary: null, _unsub: unsub, _latest: { cadence: 0, ts: 0 } });
    const timer = setInterval(() => {
      const st = get(); if (!st.session) return;
      // Program advance drives target rpm + resistance to the source ONLY for the
      // simulator. This is intentional: a real bike's resistance is READ from its
      // broadcast, not commanded on program advance — programs guide the rider via
      // the on-screen ▲/▼ cue, and only a manual +/- writes to a controllable bike.
      // (Auto-driving a real bike during programs is a deferred product decision.)
      if (src instanceof SimulatedBikeSource && !st.session.paused) {
        const seg = currentSegment(st.session);
        src.setTarget(seg ? (seg.lo + seg.hi) / 2 : 85);
        src.setResistance(st.session.resistance);
      }
      const { session, finished } = tick(st.session, st._latest);
      set({ session });
      if (finished) get().endRide();
    }, 1000);
    set({ _timer: timer });
  },
  endRide: () => {
    const st = get(); if (!st.session && !st._timer) return;
    if (st._timer) clearInterval(st._timer); st._unsub?.();
    const summary = st.session ? buildSummary(st.session, useHistory.getState().rides) : null;
    set({ session: null, summary, _timer: null, _unsub: null });
  },
  setPaused: () => set(st => ({ session: st.session ? togglePause(st.session) : null })),
  resInc: () => setResistanceLevel(get, set, 1),
  resDec: () => setResistanceLevel(get, set, -1),
  clearSummary: () => set({ summary: null }),
}));
