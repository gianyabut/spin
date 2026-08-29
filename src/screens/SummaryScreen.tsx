import React from 'react';
import { View, Pressable } from 'react-native';
import { useBike } from '../store/bikeStore';
import { useSettings } from '../store/settingsStore';
import { useHistory } from '../store/historyStore';
import { convDist, distLabel } from '../engine/formulas';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';
import { fmt } from './LiveRideScreen';
import type { Ride } from '../engine/types';

/**
 * Ride Summary — faithful port of the finalized prototype
 * (design/Yesoul PULSE App.dc.html lines 127–146). Letter-spacing em values
 * are converted to px (em × fontSize). DONE saves the ride to the top of
 * history, clears the summary, then hands control back via onDone.
 */
export function SummaryScreen({ onDone }: { onDone: () => void }) {
  const summary = useBike(s => s.summary);
  const units = useSettings(s => s.units);

  if (!summary) return <ScreenFrame style={{ paddingTop: 68, paddingBottom: 30 }}>{null}</ScreenFrame>;

  // Display strings mirror the prototype's summary render (lines 129–141).
  const summaryName = `${summary.name} · TODAY`;
  const summaryDist = convDist(summary.km, units).toFixed(1);
  const summaryTime = fmt(summary.sec);
  const summaryCal = String(summary.kcal);
  const summaryAvg = String(summary.avgRpm);

  const done = () => {
    const ride: Ride = {
      id: String(Date.now()),
      name: summary.name,
      when: 'TODAY',
      min: Math.round(summary.sec / 60),
      km: summary.km, // store km; display converts
      kcal: summary.kcal,
      date: new Date().toISOString().slice(0, 10),
    };
    useHistory.getState().addRide(ride);
    useBike.getState().clearSummary();
    onDone();
  };

  return (
    <ScreenFrame style={{ paddingHorizontal: 22, paddingTop: 68, paddingBottom: 30 }}>
      {/* Title — 58 / 800 / lh .95, two lines */}
      <T style={{ fontSize: 58, fontWeight: '800', lineHeight: 55 }}>RIDE</T>
      <T style={{ fontSize: 58, fontWeight: '800', lineHeight: 55 }}>COMPLETE</T>

      {/* Sub line — name · TODAY, 15 / 600 / .12em (1.8px) / muted */}
      <T style={{ fontSize: 15, fontWeight: '600', letterSpacing: 1.8, color: colors.muted, marginTop: 8 }}>
        {summaryName}
      </T>

      {/* PB chip — off-white bg, dark text, 15 / 800 / .15em (2.25px) */}
      {summary.pb && (
        <View
          style={{
            alignSelf: 'flex-start',
            backgroundColor: colors.text,
            marginTop: 14,
            paddingVertical: 5,
            paddingHorizontal: 12,
          }}
        >
          <T style={{ color: colors.onAccent, fontSize: 15, fontWeight: '800', letterSpacing: 2.25 }}>
            ★ NEW DISTANCE PB
          </T>
        </View>
      )}

      {/* Distance hero — solid orange block, DISTANCE eyebrow + 76 / 800 value + unit */}
      <View style={{ backgroundColor: colors.accent, marginTop: 20, paddingVertical: 22, paddingHorizontal: 20 }}>
        <T style={{ color: colors.onAccent, fontSize: 15, fontWeight: '700', letterSpacing: 3 }}>DISTANCE</T>
        <T style={{ color: colors.onAccent, fontSize: 76, fontWeight: '800', lineHeight: 76 }}>
          {summaryDist}
          <T style={{ color: colors.onAccent, fontSize: 28, fontWeight: '700' }}> {distLabel(units)}</T>
        </T>
      </View>

      {/* Attached stats row — 2px border, no top border; TIME / KCAL / AVG RPM */}
      <View style={{ flexDirection: 'row', borderWidth: 2, borderTopWidth: 0, borderColor: colors.surface }}>
        <View style={{ flex: 1, paddingVertical: 16, alignItems: 'center', borderRightWidth: 2, borderColor: colors.surface }}>
          <T style={{ fontSize: 32, fontWeight: '700' }}>{summaryTime}</T>
          <T style={{ fontSize: 12, letterSpacing: 2.4, color: colors.muted }}>TIME</T>
        </View>
        <View style={{ flex: 1, paddingVertical: 16, alignItems: 'center', borderRightWidth: 2, borderColor: colors.surface }}>
          <T style={{ fontSize: 32, fontWeight: '700' }}>{summaryCal}</T>
          <T style={{ fontSize: 12, letterSpacing: 2.4, color: colors.muted }}>KCAL</T>
        </View>
        <View style={{ flex: 1, paddingVertical: 16, alignItems: 'center' }}>
          <T style={{ fontSize: 32, fontWeight: '700' }}>{summaryAvg}</T>
          <T style={{ fontSize: 12, letterSpacing: 2.4, color: colors.muted }}>AVG RPM</T>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      {/* DONE — full-width off-white block, dark text, 18 / 800 / .15em (2.7px) */}
      <Pressable onPress={done} style={{ backgroundColor: colors.text, paddingVertical: 16 }}>
        <T style={{ textAlign: 'center', color: colors.onAccent, fontSize: 18, fontWeight: '800', letterSpacing: 2.7 }}>
          DONE
        </T>
      </Pressable>
    </ScreenFrame>
  );
}
