import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useHistory } from '../store/historyStore';
import { useSettings } from '../store/settingsStore';
import { convDist, distLabel } from '../engine/formulas';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';

/**
 * Profile — faithful port of the finalized prototype
 * (design/Yesoul PULSE App.dc.html lines 193–212).
 *
 * WEEKLY GOAL mirrors the prototype's exact derivation: the week distance is
 * the sum of ALL history km (the prototype sums `s.history`, unfiltered), shown
 * against useSettings.weeklyGoalKm. Value and goal both convert for the current
 * units; the percent is a unit-independent ratio (sum / goal), capped at 100.
 * The UNITS row toggles km↔mi; its value reads KILOMETERS / MILES. Letter-spacing
 * em values are converted to px (em × fontSize).
 */
export function ProfileScreen() {
  const rides = useHistory(s => s.rides);
  const units = useSettings(s => s.units);
  const weeklyGoalKm = useSettings(s => s.weeklyGoalKm);

  const sumKm = rides.reduce((a, r) => a + r.km, 0);
  const weekKm = convDist(sumKm, units).toFixed(1);
  const weekGoal = Math.round(convDist(weeklyGoalKm, units));
  const weekPct = Math.min(100, Math.round((sumKm / weeklyGoalKm) * 100));
  const unitsLabel = units === 'mi' ? 'MILES' : 'KILOMETERS';

  const toggleUnits = () => useSettings.getState().setUnits(units === 'km' ? 'mi' : 'km');

  return (
    <ScreenFrame>
      <ScrollView contentContainerStyle={{ paddingTop: 64, paddingHorizontal: 22, paddingBottom: 12 }}>
        {/* Header — avatar + SAM + riding-since eyebrow */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <T style={{ fontSize: 24, fontWeight: '800' }}>S</T>
          </View>
          <View>
            <T style={{ fontSize: 30, fontWeight: '800', lineHeight: 30 }}>SAM</T>
            {/* .15em × 13 = 1.95px */}
            <T style={{ fontSize: 13, fontWeight: '600', letterSpacing: 1.95, color: colors.muted, marginTop: 2 }}>
              RIDING SINCE MAY 2026
            </T>
          </View>
        </View>

        {/* WEEKLY GOAL eyebrow — 14 / 600 / .2em (2.8px) / muted */}
        <T style={{ fontSize: 14, fontWeight: '600', letterSpacing: 2.8, color: colors.muted, paddingTop: 26, paddingBottom: 8 }}>
          WEEKLY GOAL
        </T>

        {/* WEEKLY GOAL card — 2px surface border */}
        <View style={{ borderWidth: 2, borderColor: colors.surface, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <T style={{ fontSize: 34, fontWeight: '800', lineHeight: 34 }}>
              {weekKm}{' '}
              <T style={{ fontSize: 16, fontWeight: '800', color: colors.muted }}>{`/ ${weekGoal} ${distLabel(units)}`}</T>
            </T>
            <T style={{ fontSize: 16, fontWeight: '700', color: colors.accent }}>{`${weekPct}%`}</T>
          </View>
          {/* Progress track + orange fill */}
          <View style={{ height: 10, backgroundColor: colors.surface, marginTop: 12 }}>
            <View style={{ height: 10, backgroundColor: colors.accent, width: `${weekPct}%` }} />
          </View>
        </View>

        {/* SETTINGS eyebrow — 14 / 600 / .2em (2.8px) / muted */}
        <T style={{ fontSize: 14, fontWeight: '600', letterSpacing: 2.8, color: colors.muted, paddingTop: 24, paddingBottom: 4 }}>
          SETTINGS
        </T>

        {/* BIKE row */}
        <Row label="BIKE" value="YESOUL S3-4F2A · CONNECTED" valueColor={colors.accent} />

        {/* UNITS row — tap toggles km↔mi */}
        <Pressable testID="units-row" onPress={toggleUnits}>
          <Row label="UNITS" value={unitsLabel} valueColor={colors.muted} />
        </Pressable>

        {/* EXPORT TO STRAVA row */}
        <Row label="EXPORT TO STRAVA" value="COMING SOON" valueColor={colors.muted} />
      </ScrollView>
    </ScreenFrame>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 2,
        borderColor: colors.rule,
        paddingVertical: 14,
      }}
    >
      <T style={{ fontSize: 18, fontWeight: '700' }}>{label}</T>
      <T style={{ fontSize: 16, fontWeight: '600', color: valueColor }}>{value}</T>
    </View>
  );
}
