import React from 'react';
import { View, Pressable } from 'react-native';
import { useBike } from '../store/bikeStore';
import { useHistory } from '../store/historyStore';
import { useSettings } from '../store/settingsStore';
import { PROGRAMS } from '../engine/programs';
import { convDist, distLabel } from '../engine/formulas';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';
import { Bars } from '../ui/components/Bars';
import type { Program } from '../engine/types';

/**
 * Home — faithful port of the finalized prototype
 * (design/Yesoul PULSE App.dc.html lines 44–82). Greeting mirrors the
 * prototype's hour thresholds (line 300). START RIDE begins a free ride;
 * each program card starts that program. Both call onStartRide after
 * seeding the session (navigation itself is wired by the nav task).
 * Letter-spacing em values are converted to px (em × fontSize).
 */
export function HomeScreen({ onStartRide }: { onStartRide: () => void }) {
  const units = useSettings(s => s.units);
  const last = useHistory(s => s.rides[0]);

  // Time-of-day greeting — same thresholds as the prototype.
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
    <ScreenFrame style={{ paddingHorizontal: 22, paddingTop: 64, paddingBottom: 12 }}>
      {/* Header — greeting 34 / 800 / .02em (0.68px) + avatar circle */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T style={{ fontSize: 34, fontWeight: '800', letterSpacing: 0.68 }}>{greeting}</T>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T style={{ fontSize: 16, fontWeight: '700' }}>S</T>
        </View>
      </View>

      {/* Status line — ● S3 CONNECTED · READY TO RIDE, 15 / 600 / .08em (1.2px) / accent */}
      <T style={{ fontSize: 15, fontWeight: '600', letterSpacing: 1.2, color: colors.accent, marginTop: 2 }}>
        ● S3 CONNECTED · READY TO RIDE
      </T>

      {/* START RIDE hero — solid orange block, 24px padding */}
      <Pressable
        onPress={startFree}
        style={{
          marginTop: 18,
          backgroundColor: colors.accent,
          paddingVertical: 24,
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View>
          <T style={{ color: colors.onAccent, fontSize: 42, fontWeight: '800', lineHeight: 42 }}>START RIDE</T>
          <T style={{ color: colors.onAccent, fontSize: 15, fontWeight: '600', letterSpacing: 1.5, marginTop: 4 }}>
            FREE RIDE · JUST PEDAL
          </T>
        </View>
        <T style={{ color: colors.onAccent, fontSize: 42, fontWeight: '800' }}>→</T>
      </Pressable>

      {/* Two program cards — first 2 of PROGRAMS; 2px border, tap starts that program */}
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        {homePrograms.map(p => (
          <Pressable
            key={p.id}
            onPress={() => startProgram(p)}
            style={{ flex: 1, borderWidth: 2, borderColor: colors.surface, paddingVertical: 14, paddingHorizontal: 14 }}
          >
            <T style={{ fontSize: 22, fontWeight: '700', lineHeight: 22 }}>{p.name}</T>
            <T style={{ fontSize: 13, letterSpacing: 1.3, color: colors.muted, marginTop: 4 }}>{p.desc}</T>
          </Pressable>
        ))}
      </View>

      {/* THIS WEEK eyebrow — 15 / 600 / .2em (3px) / muted */}
      <T style={{ fontSize: 15, fontWeight: '600', letterSpacing: 3, color: colors.muted, paddingTop: 24, paddingBottom: 10 }}>
        THIS WEEK
      </T>
      <Bars />

      <View style={{ flex: 1 }} />

      {/* LAST RIDE footer — 2px border-top; label left, meta 20 / 700 right */}
      <View
        style={{
          borderTopWidth: 2,
          borderColor: colors.surface,
          marginTop: 16,
          paddingTop: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <T style={{ fontSize: 15, letterSpacing: 1.5, color: colors.muted }}>LAST RIDE</T>
        <T style={{ fontSize: 20, fontWeight: '700' }}>{lastRideMeta}</T>
      </View>
    </ScreenFrame>
  );
}
