import React from 'react';
import { View, ScrollView } from 'react-native';
import { useHistory } from '../store/historyStore';
import { useSettings } from '../store/settingsStore';
import { convDist, distLabel } from '../engine/formulas';
import { records, weeklyKm } from '../engine/records';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';

/**
 * Rides — "trend-led" history (lime redesign). Leads with a per-week distance
 * chart so progress is visible, then month stat tiles (borderless, hairline
 * dividers) and a RECENT list where each ride that holds its program's record is
 * flagged ★ PB. Month label + stats keep the prototype's display math.
 */
export function RidesScreen() {
  const rides = useHistory(s => s.rides);
  const monthStats = useHistory(s => s.monthStats);
  const units = useSettings(s => s.units);

  const stats = monthStats();
  const now = new Date();
  const monthLabel = `${now.toLocaleString('en-US', { month: 'long' }).toUpperCase()} ${now.getFullYear()}`;
  const monthDist = `${Math.round(convDist(stats.km, units))} ${distLabel(units)}`;

  const weeks = weeklyKm(rides, 6);
  const wMax = Math.max(1, ...weeks);
  const best = records(rides).byProgram;

  return (
    <ScreenFrame>
      <ScrollView contentContainerStyle={{ paddingTop: 64, paddingHorizontal: 22, paddingBottom: 24 }}>
        <T style={{ fontSize: 33, fontWeight: '800' }}>YOUR RIDES</T>
        <T style={{ fontSize: 13, fontWeight: '600', letterSpacing: 2.1, color: colors.muted, marginTop: 2 }}>{monthLabel}</T>

        {/* trend chart */}
        <T style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: colors.muted, marginTop: 16 }}>
          DISTANCE · LAST 6 WEEKS
        </T>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 88, marginTop: 10, borderBottomWidth: 2, borderColor: colors.rule }}>
          {weeks.map((v, i) => {
            const hi = i === weeks.length - 1;
            return (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                <View
                  style={{
                    width: '100%',
                    height: 8 + (v / wMax) * 72,
                    backgroundColor: hi ? colors.accent : colors.surface,
                  }}
                />
                <T style={{ fontSize: 9, fontWeight: '700', color: hi ? colors.accent : colors.muted }}>
                  {hi ? 'NOW' : `W${i + 1}`}
                </T>
              </View>
            );
          })}
        </View>

        {/* stat tiles — borderless */}
        <View style={{ flexDirection: 'row', marginTop: 16 }}>
          <Tile label="DISTANCE" value={monthDist} accent />
          <Tile label="RIDES" value={String(stats.rides)} divider />
          <Tile label="HOURS" value={String(stats.hours)} divider />
        </View>

        {/* recent list */}
        <T style={{ fontSize: 13, fontWeight: '600', letterSpacing: 2.8, color: colors.muted, paddingTop: 20, paddingBottom: 4 }}>
          RECENT
        </T>
        {rides.map(r => {
          const isPB = r.km === best[r.name];
          return (
            <View
              key={r.id}
              style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                borderBottomWidth: 2, borderColor: colors.rule, paddingVertical: 13,
              }}
            >
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <T style={{ fontSize: 20, fontWeight: '700' }}>{r.name.toUpperCase()}</T>
                  {isPB && (
                    <View style={{ backgroundColor: colors.accent, paddingHorizontal: 6, paddingVertical: 1 }}>
                      <T style={{ fontSize: 10, fontWeight: '800', letterSpacing: 0.6, color: colors.onAccent }}>★ PB</T>
                    </View>
                  )}
                </View>
                <T style={{ fontSize: 12, letterSpacing: 1, color: colors.muted, marginTop: 2 }}>
                  {`${r.when} · ${r.min} MIN · ${r.kcal} KCAL`}
                </T>
              </View>
              <T style={{ fontSize: 24, fontWeight: '800', color: colors.accent }}>
                {`${convDist(r.km, units).toFixed(1)} ${distLabel(units)}`}
              </T>
            </View>
          );
        })}
      </ScrollView>
    </ScreenFrame>
  );
}

function Tile({ label, value, accent, divider }: { label: string; value: string; accent?: boolean; divider?: boolean }) {
  return (
    <View style={{ flex: 1, paddingLeft: divider ? 12 : 0, borderLeftWidth: divider ? 2 : 0, borderColor: colors.rule }}>
      <T style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: colors.muted }}>{label}</T>
      <T style={{ fontSize: 28, fontWeight: '800', lineHeight: 30, marginTop: 4, color: accent ? colors.accent : colors.text }}>{value}</T>
    </View>
  );
}
