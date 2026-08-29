import { create } from 'zustand';
import type { BikeSource, BikeReading, ConnState } from '../ble/BikeSource';
import { SimulatedBikeSource } from '../ble/SimulatedBikeSource';
import type { Program, Session, Summary } from '../engine/types';
import { startSession, tick, togglePause, currentSegment, buildSummary } from '../engine/rideEngine';
import { useHistory } from './historyStore';

type S = {
  source: BikeSource; conn: ConnState; session: Session | null; summary: Summary | null;
  _latest: BikeReading; _timer: any; _unsub: (() => void) | null;
  setSource: (src: BikeSource) => void;
  startRide: (p: Program | null) => void;
  endRide: () => void;
  setPaused: () => void;
  resInc: () => void; resDec: () => void;
  clearSummary: () => void;
};
export const useBike = create<S>((set, get) => ({
  source: new SimulatedBikeSource(), conn: 'idle', session: null, summary: null,
  _latest: { cadence: 0, ts: 0 }, _timer: null, _unsub: null,
  setSource: (src) => { set({ source: src }); src.onState(conn => set({ conn })); },
  startRide: (program) => {
    const prev = get(); if (prev._timer) clearInterval(prev._timer); prev._unsub?.();
    const src = get().source;
    const unsub = src.onData(r => set({ _latest: r }));
    set({ session: startSession(program), summary: null, _unsub: unsub });
    const timer = setInterval(() => {
      const st = get(); if (!st.session) return;
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
  resInc: () => set(st => st.session ? { session: { ...st.session, resistance: Math.min(32, st.session.resistance + 1) } } : {}),
  resDec: () => set(st => st.session ? { session: { ...st.session, resistance: Math.max(1, st.session.resistance - 1) } } : {}),
  clearSummary: () => set({ summary: null }),
}));
