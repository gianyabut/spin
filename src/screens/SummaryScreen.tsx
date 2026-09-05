import React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useBike } from '../store/bikeStore';
import { useSettings } from '../store/settingsStore';
import { useHistory } from '../store/historyStore';
import { convDist, distLabel } from '../engine/formulas';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';
import { fmt } from './LiveRideScreen';
import type { Ride } from '../engine/types';

const HERO = require('../../assets/photos/ride-hero.jpg');

const CONFETTI = [
  { left: '12%', top: '20%', c: colors.accent, r: '20deg' },
  { left: '82%', top: '16%', c: colors.text, r: '-30deg' },
  { left: '30%', top: '12%', c: colors.accent, r: '50deg' },
  { left: '66%', top: '28%', c: colors.accent, r: '-12deg' },
  { left: '48%', top: '8%', c: colors.text, r: '40deg' },
  { left: '20%', top: '40%', c: colors.accent, r: '-40deg' },
  { left: '88%', top: '44%', c: colors.text, r: '15deg' },
] as const;

/**
 * Ride Summary — "photo celebration" (lime redesign). A graded photo hero with
 * confetti + a NEW DISTANCE PB chip; below, the distance with the PREVIOUS BEST
 * struck through so the win is unmistakable. DONE still saves the ride to the top
 * of history, clears the summary, and hands back via onDone.
 */
export function SummaryScreen({ onDone }: { onDone: () => void }) {
  const summary = useBike(s => s.summary);
  const units = useSettings(s => s.units);

  if (!summary) return <ScreenFrame style={{ paddingTop: 68, paddingBottom: 30 }}>{null}</ScreenFrame>;

  const summaryDist = convDist(summary.km, units).toFixed(1);
  const showPrev = summary.pb && summary.prevBestKm != null && summary.prevBestKm > 0;
  const deltaKm = showPrev ? summary.km - (summary.prevBestKm as number) : 0;

  const done = () => {
    const ride: Ride = {
      id: String(Date.now()),
      name: summary.name,
      when: 'TODAY',
      min: Math.round(summary.sec / 60),
      km: summary.km,
      kcal: summary.kcal,
      date: new Date().toISOString().slice(0, 10),
    };
    useHistory.getState().addRide(ride);
    useBike.getState().clearSummary();
    onDone();
  };

  return (
    <ScreenFrame style={{ padding: 0 }}>
      {/* photo hero */}
      <View style={{ flex: 0.85, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <Image source={HERO} contentFit="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(9,11,7,0.42)' }} />
        <LinearGradient
          colors={['rgba(9,11,7,0.5)', 'rgba(9,11,7,0.15)', colors.bg]}
          locations={[0, 0.5, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {CONFETTI.map((p, i) => (
          <View key={i} style={{ position: 'absolute', left: p.left as any, top: p.top as any, width: 8, height: 12, backgroundColor: p.c, transform: [{ rotate: p.r }] }} />
        ))}
        <T style={{ fontSize: 44, fontWeight: '800', lineHeight: 40, textAlign: 'center' }}>RIDE</T>
        <T style={{ fontSize: 44, fontWeight: '800', lineHeight: 42, textAlign: 'center' }}>COMPLETE</T>
        <T style={{ fontSize: 13, fontWeight: '600', letterSpacing: 1.8, color: colors.text, opacity: 0.9, marginTop: 8 }}>
          {summary.name} · TODAY
        </T>
        {summary.pb && (
          <View style={{ backgroundColor: colors.accent, marginTop: 14, paddingVertical: 6, paddingHorizontal: 13 }}>
            <T style={{ color: colors.onAccent, fontSize: 13, fontWeight: '800', letterSpacing: 2.1 }}>★ NEW DISTANCE PB</T>
          </View>
        )}
      </View>

      {/* content */}
      <View style={{ flex: 1, paddingHorizontal: 22, paddingBottom: 26, paddingTop: 8 }}>
        <T style={{ fontSize: 12, fontWeight: '700', letterSpacing: 3, color: colors.muted }}>DISTANCE</T>
        <T style={{ fontSize: 72, fontWeight: '800', lineHeight: 68 }}>
          {summaryDist}
          <T style={{ fontSize: 26, fontWeight: '700', color: colors.muted }}> {distLabel(units)}</T>
        </T>
        {showPrev && (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 12, marginTop: 8 }}>
            <T style={{ fontSize: 15, fontWeight: '700', color: colors.muted, textDecorationLine: 'line-through' }}>
              PREVIOUS BEST {convDist(summary.prevBestKm as number, units).toFixed(1)} {distLabel(units)}
            </T>
            <T style={{ fontSize: 16, fontWeight: '800', color: colors.accent }}>
              ▲ +{convDist(deltaKm, units).toFixed(1)} {distLabel(units)}
            </T>
          </View>
        )}

        {/* stats */}
        <View style={{ flexDirection: 'row', marginTop: 18 }}>
          <Stat value={fmt(summary.sec)} label="TIME" />
          <Stat value={String(summary.kcal)} label="KCAL" divider />
          <Stat value={String(summary.avgRpm)} label="AVG RPM" divider />
        </View>

        <View style={{ flex: 1 }} />

        {/* actions */}
        <Pressable onPress={() => {/* share card — coming soon */}} style={{ borderWidth: 2, borderColor: colors.surface, paddingVertical: 13, marginBottom: 10 }}>
          <T style={{ textAlign: 'center', fontSize: 14, fontWeight: '700', letterSpacing: 2.2 }}>SHARE RIDE</T>
        </Pressable>
        <Pressable onPress={done} style={{ backgroundColor: colors.text, paddingVertical: 16 }}>
          <T style={{ textAlign: 'center', color: colors.onAccent, fontSize: 18, fontWeight: '800', letterSpacing: 2.7 }}>DONE</T>
        </Pressable>
      </View>
    </ScreenFrame>
  );
}

function Stat({ value, label, divider }: { value: string; label: string; divider?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: divider ? 2 : 0, borderColor: colors.rule }}>
      <T style={{ fontSize: 30, fontWeight: '800' }}>{value}</T>
      <T style={{ fontSize: 11, letterSpacing: 2, color: colors.muted, marginTop: 3 }}>{label}</T>
    </View>
  );
}
