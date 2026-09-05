import React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useHistory } from '../store/historyStore';
import { useSettings } from '../store/settingsStore';
import { useBike } from '../store/bikeStore';
import { PROGRAMS } from '../engine/programs';
import { convDist, distLabel } from '../engine/formulas';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';
import type { Program } from '../engine/types';

const HERO = require('../../assets/photos/ride-hero.jpg');

/**
 * Home — "image hero" (lime redesign). A full-bleed graded cycling photo carries
 * the greeting + connection status + a floating START RIDE block; programs are
 * borderless list rows (no card stack), and the last ride sits on a hairline.
 * Behaviour is unchanged: START RIDE begins a free ride, a program row starts
 * that program, both seed the session then call onStartRide.
 */
export function HomeScreen({ onStartRide }: { onStartRide: () => void }) {
  const units = useSettings(s => s.units);
  const last = useHistory(s => s.rides[0]);

  const h = new Date().getHours();
  const greeting = (h < 12 ? 'MORNING' : h < 18 ? 'AFTERNOON' : 'EVENING') + ', SAM';

  const lastRideMeta = last
    ? `${convDist(last.km, units).toFixed(1)} ${distLabel(units)} · ${last.min} MIN · ${last.kcal} KCAL`
    : '—';

  const startFree = () => {
    useBike.getState().startRide(null);
    onStartRide();
  };
  const startProgram = (p: Program) => {
    useBike.getState().startRide(p);
    onStartRide();
  };

  const homePrograms = PROGRAMS.slice(0, 2);

  return (
    <ScreenFrame style={{ padding: 0 }}>
      {/* HERO — full-bleed graded photo */}
      <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 22, paddingBottom: 18, overflow: 'hidden' }}>
        <Image source={HERO} contentFit="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <LinearGradient
          colors={['rgba(9,11,7,0.35)', 'rgba(9,11,7,0)', 'rgba(9,11,7,0)', 'rgba(9,11,7,0.72)', colors.bg]}
          locations={[0, 0.24, 0.44, 0.78, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />

        {/* status + avatar */}
        <View style={{ position: 'absolute', top: 58, left: 22, right: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T style={{ fontSize: 13, fontWeight: '700', letterSpacing: 1.3, color: colors.accent }}>● S3 CONNECTED · READY TO RIDE</T>
          <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(9,11,7,0.4)', borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
            <T style={{ fontSize: 15, fontWeight: '800' }}>S</T>
          </View>
        </View>

        {/* greeting + START block (bottom of hero) */}
        <T style={{ fontSize: 50, fontWeight: '800', lineHeight: 47, letterSpacing: 0.5 }}>{greeting}</T>
        <T style={{ fontSize: 13, fontWeight: '600', letterSpacing: 1.8, color: colors.text, opacity: 0.9, marginTop: 8, marginBottom: 14 }}>
          READY WHEN YOU ARE — JUST PEDAL
        </T>
        <Pressable
          onPress={startFree}
          style={({ pressed }) => ({
            backgroundColor: colors.accent, paddingVertical: 15, paddingHorizontal: 18,
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          <View>
            <T style={{ color: colors.onAccent, fontSize: 26, fontWeight: '800', lineHeight: 24 }}>START RIDE</T>
            <T style={{ color: colors.onAccent, fontSize: 12, fontWeight: '600', letterSpacing: 1.2, marginTop: 2 }}>FREE RIDE</T>
          </View>
          <T style={{ color: colors.onAccent, fontSize: 30, fontWeight: '800' }}>→</T>
        </Pressable>
      </View>

      {/* BODY — program rows + last ride */}
      <View style={{ paddingHorizontal: 22, paddingTop: 6, paddingBottom: 12 }}>
        {homePrograms.map((p, i) => (
          <Pressable
            key={p.id}
            onPress={() => startProgram(p)}
            style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingVertical: 13,
              borderTopWidth: i === 0 ? 2 : 0, borderBottomWidth: 2, borderColor: colors.rule,
            }}
          >
            <View>
              <T style={{ fontSize: 20, fontWeight: '700', lineHeight: 20 }}>{p.name}</T>
              <T style={{ fontSize: 11, letterSpacing: 1.3, color: colors.muted, marginTop: 2 }}>{p.desc}</T>
            </View>
            <T style={{ fontSize: 20, fontWeight: '800', color: colors.accent }}>→</T>
          </Pressable>
        ))}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 12 }}>
          <T style={{ fontSize: 12, letterSpacing: 2, color: colors.muted }}>LAST RIDE</T>
          <T style={{ fontSize: 16, fontWeight: '700' }}>{lastRideMeta}</T>
        </View>
      </View>
    </ScreenFrame>
  );
}
