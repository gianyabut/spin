import React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useBike } from '../store/bikeStore';
import { useSettings } from '../store/settingsStore';
import { useHistory } from '../store/historyStore';
import { currentSegment, resCue } from '../engine/rideEngine';
import { bestKmForProgram, ghostAheadKm } from '../engine/records';
import { convDist, convSpeed, distLabel, speedLabel } from '../engine/formulas';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';
import { MetricColumn } from '../ui/components/MetricColumn';

const HERO = require('../../assets/photos/ride-hero.jpg');

// mm:ss — mirrors the prototype's `fmt(sec)`.
export function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}

/**
 * Live Ride — "ambient photo cockpit" (lime redesign). The graded cycling photo
 * sits faintly behind the data (hard-darkened for legibility). Keeps the interval
 * bar, phase banner, WATTS metric row and floating PAUSE/END. Adds a ghost-race
 * PB strip (program rides only): races the rider against a constant-pace ghost of
 * their best ride for that program.
 */
export function LiveRideScreen({ onEnd }: { onEnd: () => void }) {
  const session = useBike(s => s.session);
  const setPaused = useBike(s => s.setPaused);
  const units = useSettings(s => s.units);
  const rides = useHistory(s => s.rides);

  if (!session) return <ScreenFrame style={{ paddingTop: 64, paddingBottom: 30 }}>{null}</ScreenFrame>;

  const seg = currentSegment(session);
  const hasProgram = !!session.program;
  const totalDur = session.program ? session.program.segs.reduce((a, g) => a + g.dur, 0) : 0;

  const rideMode = session.program
    ? `${session.program.name} · INTERVAL ${session.segIdx + 1}/${session.program.segs.length}`
    : 'FREE RIDE';
  const rideClock = session.program ? fmt(Math.max(0, totalDur - session.elapsed)) + ' LEFT' : fmt(session.elapsed);

  const isRecover = !!seg && (seg.label === 'RECOVER' || seg.label === 'COOL DOWN' || seg.label === 'WARM UP');
  const bannerBg = isRecover ? colors.rule : colors.accent;
  const bannerFg = isRecover ? colors.text : colors.onAccent;

  const cadence = Math.round(session.cadence);
  const targetLabel = seg ? `RPM · TARGET ${seg.lo}–${seg.hi}` : 'RPM · FIND YOUR RHYTHM';
  const resistanceLabel = 'RESISTANCE ' + session.resistance;
  const speedFmt = convSpeed(session.speedKmh, units).toFixed(1);
  const distFmt = convDist(session.distanceKm, units).toFixed(1);
  const elapsedFmt = fmt(session.elapsed);
  const pauseLabel = session.paused ? 'RESUME' : 'PAUSE';

  // Ghost race — program rides with a prior best for that program.
  let ghost: { ahead: number; curFrac: number; ghostFrac: number } | null = null;
  if (session.program) {
    const pbKm = bestKmForProgram(rides, session.program.name);
    if (pbKm > 0) {
      const pbRide = rides.filter(r => r.name === session.program!.name).reduce((a, b) => (b.km > a.km ? b : a));
      const pbSec = pbRide.min * 60;
      ghost = {
        ahead: ghostAheadKm(session.distanceKm, session.elapsed, pbKm, pbSec),
        curFrac: Math.min(1, session.distanceKm / pbKm),
        ghostFrac: pbSec > 0 ? Math.min(1, session.elapsed / pbSec) : 0,
      };
    }
  }

  return (
    <ScreenFrame style={{ padding: 0 }}>
      {/* ambient photo, hard-darkened */}
      <Image source={HERO} contentFit="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,11,7,0.72)' }} />
      <LinearGradient
        colors={['rgba(9,11,7,0.7)', 'rgba(9,11,7,0.45)', 'rgba(9,11,7,0.85)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View style={{ flex: 1, paddingTop: 60, paddingBottom: 26, paddingHorizontal: 22 }}>
        {/* header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <T style={{ fontSize: 14, fontWeight: '600', letterSpacing: 0.7, color: colors.text }}>{rideMode}</T>
          <T style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>{rideClock}</T>
        </View>

        {/* interval bar + phase banner (program only) */}
        {hasProgram && session.program && (
          <>
            <View style={{ flexDirection: 'row', gap: 3, paddingTop: 10 }}>
              {session.program.segs.map((g, i) => (
                <View
                  key={i}
                  style={{
                    flexGrow: Math.max(1, Math.round(g.dur / 30)), flexBasis: 0, height: 6,
                    backgroundColor: i < session.segIdx ? colors.accent : i === session.segIdx ? colors.text : 'rgba(255,255,255,0.25)',
                  }}
                />
              ))}
            </View>
            <View
              style={{
                backgroundColor: bannerBg, marginTop: 12, paddingVertical: 9, paddingHorizontal: 14,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
              }}
            >
              <T style={{ fontSize: 19, fontWeight: '800', letterSpacing: 0.8, color: bannerFg }}>{seg ? seg.label : ''}</T>
              <T style={{ fontSize: 19, fontWeight: '800', color: bannerFg }}>{seg ? fmt(seg.dur - session.segElapsed) : ''}</T>
            </View>
          </>
        )}

        {/* ghost race strip */}
        {ghost && (
          <View style={{ marginTop: 10, backgroundColor: 'rgba(9,11,7,0.42)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <T style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: colors.muted }}>
                RACING YOUR BEST · {session.program!.name}
              </T>
              <T style={{ fontSize: 12, fontWeight: '800', letterSpacing: 0.6, color: ghost.ahead >= 0 ? colors.accent : colors.text }}>
                {ghost.ahead >= 0 ? '▲ +' : '▼ '}{convDist(Math.abs(ghost.ahead), units).toFixed(1)} {distLabel(units)} {ghost.ahead >= 0 ? 'AHEAD' : 'BEHIND'}
              </T>
            </View>
            <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.18)', marginTop: 10, position: 'relative' }}>
              <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${ghost.curFrac * 100}%`, backgroundColor: colors.accent }} />
              {/* ghost marker */}
              <View style={{ position: 'absolute', left: `${ghost.ghostFrac * 100}%`, top: -3, width: 2, height: 9, backgroundColor: colors.text }} />
            </View>
          </View>
        )}

        {/* PAUSED banner */}
        {session.paused && (
          <View style={{ marginTop: 12, borderWidth: 2, borderColor: colors.text, paddingVertical: 8 }}>
            <T style={{ textAlign: 'center', fontSize: 16, fontWeight: '800', letterSpacing: 4.8 }}>PAUSED</T>
          </View>
        )}

        {/* cadence hero */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <T style={{ fontSize: 150, fontWeight: '800', lineHeight: 142, letterSpacing: -2 }}>{cadence}</T>
          <T style={{ fontSize: 15, fontWeight: '600', letterSpacing: 4.2, color: colors.text, opacity: 0.85, marginTop: 2, textAlign: 'center' }}>
            {targetLabel}
          </T>
          <View style={{ marginTop: 12, borderWidth: 2, borderColor: colors.accent, paddingVertical: 5, paddingHorizontal: 15, backgroundColor: 'rgba(9,11,7,0.35)' }}>
            <T style={{ color: colors.accent, fontSize: 15, fontWeight: '700', letterSpacing: 1.5 }}>
              {resistanceLabel}
              {resCue(session)}
            </T>
          </View>
        </View>

        {/* metrics */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingBottom: 14 }}>
          <MetricColumn value={speedFmt} label={speedLabel(units)} />
          <MetricColumn value={distFmt} label={distLabel(units)} />
          <MetricColumn value={String(Math.round(session.power))} label="WATTS" />
          <MetricColumn value={elapsedFmt} label="TIME" />
        </View>

        {/* controls */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable onPress={setPaused} style={{ flex: 1, borderWidth: 2, borderColor: 'rgba(255,255,255,0.38)', backgroundColor: 'rgba(9,11,7,0.35)', paddingVertical: 14 }}>
            <T style={{ textAlign: 'center', fontSize: 16, fontWeight: '800', letterSpacing: 2.4 }}>{pauseLabel}</T>
          </Pressable>
          <Pressable
            onPress={() => {
              useBike.getState().endRide();
              onEnd();
            }}
            style={{ flex: 1, backgroundColor: colors.text, paddingVertical: 14 }}
          >
            <T style={{ textAlign: 'center', color: colors.onAccent, fontSize: 16, fontWeight: '800', letterSpacing: 2.4 }}>END</T>
          </Pressable>
        </View>
      </View>
    </ScreenFrame>
  );
}
