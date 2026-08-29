import React from 'react';
import { View, ScrollView } from 'react-native';
import { useHistory } from '../store/historyStore';
import { useSettings } from '../store/settingsStore';
import { convDist, distLabel } from '../engine/formulas';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';

/**
 * Rides history — faithful port of the finalized prototype
 * (design/Yesoul PULSE App.dc.html lines 148–167). Rows are display-only
 * (the prototype's history rows aren't tappable). The month label mirrors
 * the prototype's "<MONTH> <YEAR>" from the current date. Stat values come
 * from useHistory.monthStats() (which carries the prototype's baked-in
 * aggregate offsets). Letter-spacing em values are converted to px
 * (em × fontSize).
 */
export function RidesScreen() {
  const rides = useHistory(s => s.rides);
  const monthStats = useHistory(s => s.monthStats);
  const units = useSettings(s => s.units);

  const stats = monthStats();
  const now = new Date();
  const monthLabel = `${now.toLocaleString('en-US', { month: 'long' }).toUpperCase()} ${now.getFullYear()}`;

  // DISTANCE card value converts the aggregate km + shows the unit, like the prototype's monthKm.
  const monthDist = `${Math.round(convDist(stats.km, units))} ${distLabel(units)}`;

  return (
    <ScreenFrame>
      <ScrollView contentContainerStyle={{ paddingTop: 64, paddingHorizontal: 22, paddingBottom: 12 }}>
        {/* Title — 34 / 800 */}
        <T style={{ fontSize: 34, fontWeight: '800' }}>YOUR RIDES</T>

        {/* Month sub — 14 / 600 / .15em (2.1px) / muted */}
        <T style={{ fontSize: 14, fontWeight: '600', letterSpacing: 2.1, color: colors.muted, marginTop: 2 }}>
          {monthLabel}
        </T>

        {/* Stat cards — DISTANCE (solid orange), RIDES, HOURS */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          {/* DISTANCE — solid orange block, dark text */}
          <View style={{ flex: 1, backgroundColor: colors.accent, paddingVertical: 14, paddingHorizontal: 14 }}>
            <T style={{ color: colors.onAccent, fontSize: 12, fontWeight: '700', letterSpacing: 1.8 }}>DISTANCE</T>
            <T style={{ color: colors.onAccent, fontSize: 30, fontWeight: '800', lineHeight: 30, marginTop: 4 }}>
              {monthDist}
            </T>
          </View>
          {/* RIDES — 2px-border card */}
          <View style={{ flex: 1, borderWidth: 2, borderColor: colors.surface, paddingVertical: 12, paddingHorizontal: 14 }}>
            <T style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1.8, color: colors.muted }}>RIDES</T>
            <T style={{ fontSize: 30, fontWeight: '800', lineHeight: 30, marginTop: 4 }}>{String(stats.rides)}</T>
          </View>
          {/* HOURS — 2px-border card */}
          <View style={{ flex: 1, borderWidth: 2, borderColor: colors.surface, paddingVertical: 12, paddingHorizontal: 14 }}>
            <T style={{ fontSize: 12, fontWeight: '700', letterSpacing: 1.8, color: colors.muted }}>HOURS</T>
            <T style={{ fontSize: 30, fontWeight: '800', lineHeight: 30, marginTop: 4 }}>{String(stats.hours)}</T>
          </View>
        </View>

        {/* RECENT eyebrow — 14 / 600 / .2em (2.8px) / muted */}
        <T style={{ fontSize: 14, fontWeight: '600', letterSpacing: 2.8, color: colors.muted, paddingTop: 22, paddingBottom: 6 }}>
          RECENT
        </T>

        {/* Rows — name upper + meta left, distance (accent) right; 2px #241f27 rule */}
        <View>
          {rides.map(r => (
            <View
              key={r.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottomWidth: 2,
                borderColor: colors.rule,
                paddingVertical: 14,
              }}
            >
              <View>
                <T style={{ fontSize: 20, fontWeight: '700' }}>{r.name.toUpperCase()}</T>
                <T style={{ fontSize: 13, letterSpacing: 1.04, color: colors.muted, marginTop: 2 }}>
                  {`${r.when} · ${r.min} MIN · ${r.kcal} KCAL`}
                </T>
              </View>
              <T style={{ fontSize: 26, fontWeight: '800', color: colors.accent }}>
                {`${convDist(r.km, units).toFixed(1)} ${distLabel(units)}`}
              </T>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenFrame>
  );
}
