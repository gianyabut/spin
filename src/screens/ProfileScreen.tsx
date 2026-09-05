import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line } from 'react-native-svg';
import { useHistory } from '../store/historyStore';
import { useSettings } from '../store/settingsStore';
import { convDist, distLabel } from '../engine/formulas';
import { records } from '../engine/records';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';

const COVER = require('../../assets/photos/ride-hero.jpg');
const RING = 190;
const C = 2 * Math.PI * 43; // circumference for r=43

/**
 * Profile — "goal gauge + photo cover" (lime redesign). A graded cover banner
 * behind the rider, a weekly-goal ring with gauge ticks + breathing glow (the
 * recurring lime ring: radar → cadence → goal), a records strip, then live
 * settings. WEEKLY GOAL math + the UNITS toggle are unchanged.
 */
export function ProfileScreen() {
  const rides = useHistory(s => s.rides);
  const units = useSettings(s => s.units);
  const weeklyGoalKm = useSettings(s => s.weeklyGoalKm);

  const sumKm = rides.reduce((a, r) => a + r.km, 0);
  const weekKm = convDist(sumKm, units).toFixed(1);
  const weekGoal = Math.round(convDist(weeklyGoalKm, units));
  const weekPct = Math.min(100, Math.round((sumKm / weeklyGoalKm) * 100));
  const remainKm = Math.max(0, weeklyGoalKm - sumKm);
  const unitsLabel = units === 'mi' ? 'MILES' : 'KILOMETERS';

  const rec = records(rides);
  const bestHiit = rec.byProgram['HIIT 30'] ?? 0;

  const toggleUnits = () => useSettings.getState().setUnits(units === 'km' ? 'mi' : 'km');
  const dashoffset = C * (1 - weekPct / 100);

  return (
    <ScreenFrame style={{ padding: 0 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 26 }}>
        {/* cover */}
        <View style={{ height: 186, justifyContent: 'flex-end', padding: 22, overflow: 'hidden' }}>
          <Image source={COVER} contentFit="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <LinearGradient
            colors={['rgba(9,11,7,0.35)', 'rgba(9,11,7,0.1)', 'rgba(9,11,7,0.7)', colors.bg]}
            locations={[0, 0.34, 0.76, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.bg, borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
              <T style={{ fontSize: 26, fontWeight: '800' }}>S</T>
            </View>
            <View>
              <T style={{ fontSize: 34, fontWeight: '800', lineHeight: 31 }}>SAM</T>
              <T style={{ fontSize: 12, fontWeight: '600', letterSpacing: 1.9, color: colors.text, opacity: 0.9, marginTop: 3 }}>RIDING SINCE MAY 2026</T>
            </View>
          </View>
        </View>

        {/* goal ring */}
        <View style={{ alignItems: 'center', marginTop: 6 }}>
          <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: colors.accent, opacity: 0.14 }} />
            <Svg width={RING} height={RING} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
              {/* gauge ticks */}
              <Line x1="50" y1="3" x2="50" y2="8" stroke={colors.surface} strokeWidth={2} />
              <Line x1="97" y1="50" x2="92" y2="50" stroke={colors.surface} strokeWidth={2} />
              <Line x1="50" y1="97" x2="50" y2="92" stroke={colors.surface} strokeWidth={2} />
              <Line x1="3" y1="50" x2="8" y2="50" stroke={colors.surface} strokeWidth={2} />
              <Circle cx="50" cy="50" r="43" fill="none" stroke={colors.surface} strokeWidth={7} />
              <Circle
                cx="50" cy="50" r="43" fill="none" stroke={colors.accent} strokeWidth={7}
                strokeDasharray={C} strokeDashoffset={dashoffset}
                transform="rotate(-90 50 50)"
              />
            </Svg>
            <View style={{ alignItems: 'center' }}>
              <T style={{ fontSize: 11, fontWeight: '700', letterSpacing: 2.6, color: colors.muted }}>WEEKLY GOAL</T>
              <T style={{ fontSize: 54, fontWeight: '800', lineHeight: 46, color: colors.accent }}>{weekPct}%</T>
              <T style={{ fontSize: 15, fontWeight: '700' }}>
                {weekKm} <T style={{ color: colors.muted }}>{`/ ${weekGoal} ${distLabel(units)}`}</T>
              </T>
            </View>
          </View>
          <T style={{ fontSize: 13, fontWeight: '700', letterSpacing: 0.8, color: colors.text, marginTop: 10 }}>
            {weekPct >= 100 ? '▲ GOAL SMASHED' : `▲ ${convDist(remainKm, units).toFixed(1)} ${distLabel(units)} TO GO`}
          </T>
        </View>

        {/* records strip */}
        <View style={{ flexDirection: 'row', marginTop: 20, paddingHorizontal: 22 }}>
          <Rec value={`${convDist(rec.longestKm, units).toFixed(1)}`} unit={distLabel(units)} label="Longest ride" />
          <Rec value={`${convDist(bestHiit, units).toFixed(1)}`} unit={distLabel(units)} label="Best HIIT 30" divider />
          <Rec value={String(rides.length)} unit="TOTAL" label="Rides" divider />
        </View>

        {/* settings */}
        <View style={{ paddingHorizontal: 22 }}>
          <T style={{ fontSize: 12, fontWeight: '800', letterSpacing: 2.6, color: colors.muted, marginTop: 20, marginBottom: 2 }}>SETTINGS</T>
          <Row label="BIKE" value="YESOUL S3-4F2A · CONNECTED" valueColor={colors.accent} connected />
          <Pressable testID="units-row" onPress={toggleUnits}>
            <Row label="UNITS" value={unitsLabel} valueColor={colors.muted} />
          </Pressable>
          <Row label="EXPORT TO STRAVA" value="COMING SOON" valueColor={colors.muted} />
        </View>
      </ScrollView>
    </ScreenFrame>
  );
}

function Rec({ value, unit, label, divider }: { value: string; unit: string; label: string; divider?: boolean }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', borderLeftWidth: divider ? 2 : 0, borderColor: colors.rule }}>
      <T style={{ fontSize: 22, fontWeight: '800', color: colors.accent, lineHeight: 22 }}>
        {value}<T style={{ fontSize: 11, color: colors.muted }}> {unit}</T>
      </T>
      <T style={{ fontSize: 10, fontWeight: '700', letterSpacing: 0.8, color: colors.muted, marginTop: 6, textTransform: 'uppercase' }}>{label}</T>
    </View>
  );
}

function Row({ label, value, valueColor, connected }: { label: string; value: string; valueColor: string; connected?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderColor: colors.rule, paddingVertical: 13 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <View style={{ width: 6, height: 6, backgroundColor: connected ? colors.accent : colors.surface }} />
        <T style={{ fontSize: 16, fontWeight: '700' }}>{label}</T>
      </View>
      <T style={{ fontSize: 14, fontWeight: '600', color: valueColor }}>{value}</T>
    </View>
  );
}
