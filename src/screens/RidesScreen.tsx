import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useHistory } from '../store/historyStore';
import { useSettings } from '../store/settingsStore';
import { convDist, distLabel } from '../engine/formulas';
import { records } from '../engine/records';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';
import type { Ride } from '../engine/types';

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];
// Month label from an ISO 'YYYY-MM-DD' date, parsed manually to avoid the
// timezone shift `new Date('YYYY-MM-DD')` (UTC midnight) can cause.
function monthLabel(date: string): string {
  const [y, m] = date.split('-').map(Number);
  return `${MONTHS[(m || 1) - 1]} ${y}`;
}

const isFree = (r: Ride) => r.name.trim().toLowerCase() === 'free ride';

type Filter = 'all' | 'free' | 'programs';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'free', label: 'FREE' },
  { key: 'programs', label: 'PROGRAMS' },
];

/**
 * Rides — "history-first" (lime redesign). The screen is the rider's full ride
 * log: a header count + total distance, an All/Free/Programs filter, then every
 * ride grouped by month (newest first) with a ★ PB badge on record holders.
 * The 6-week trend + month stats moved to Profile. Empty state when there are
 * no rides (or the active filter has no matches).
 */
export function RidesScreen() {
  const rides = useHistory(s => s.rides);
  const units = useSettings(s => s.units);
  const [filter, setFilter] = useState<Filter>('all');

  const totalKm = Math.round(convDist(rides.reduce((a, r) => a + r.km, 0), units));
  const best = records(rides).byProgram;

  const shown = rides.filter(r => filter === 'all' ? true : filter === 'free' ? isFree(r) : !isFree(r));

  // Group the filtered rides by month, preserving the newest-first order.
  const groups: { label: string; rides: Ride[] }[] = [];
  const idx: Record<string, number> = {};
  shown.forEach(r => {
    const label = monthLabel(r.date);
    if (!(label in idx)) { idx[label] = groups.length; groups.push({ label, rides: [] }); }
    groups[idx[label]].rides.push(r);
  });

  return (
    <ScreenFrame>
      <ScrollView contentContainerStyle={{ paddingTop: 64, paddingHorizontal: 22, paddingBottom: 24 }}>
        <T style={{ fontSize: 33, fontWeight: '800' }}>YOUR RIDES</T>
        <T style={{ fontSize: 13, fontWeight: '600', letterSpacing: 2.1, color: colors.muted, marginTop: 2 }}>
          {`${rides.length} RIDES · ${totalKm} ${distLabel(units)} TOTAL`}
        </T>

        {/* filter chips (hidden when there is no history at all) */}
        {rides.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
            {FILTERS.map(f => {
              const on = filter === f.key;
              return (
                <Pressable
                  key={f.key}
                  onPress={() => setFilter(f.key)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 6,
                    borderWidth: 2, borderColor: on ? colors.accent : colors.surface,
                    backgroundColor: on ? colors.accent : 'transparent',
                  }}
                >
                  <T style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1, color: on ? colors.onAccent : colors.muted }}>
                    {f.label}
                  </T>
                </Pressable>
              );
            })}
          </View>
        )}

        {shown.length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 90, gap: 12 }}>
            <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <T style={{ fontSize: 34, fontWeight: '800', color: colors.muted }}>○</T>
            </View>
            <T style={{ fontSize: 26, fontWeight: '800' }}>NO RIDES YET</T>
            <T style={{ fontSize: 13, fontWeight: '600', letterSpacing: 0.6, color: colors.muted, textAlign: 'center', maxWidth: 220 }}>
              {rides.length === 0 ? 'YOUR RIDES WILL APPEAR HERE ONCE YOU FINISH ONE.' : 'NO RIDES MATCH THIS FILTER.'}
            </T>
          </View>
        ) : (
          groups.map(g => (
            <View key={g.label}>
              <T style={{ fontSize: 12, fontWeight: '800', letterSpacing: 2.2, color: colors.muted, marginTop: 20, marginBottom: 2 }}>
                {g.label}
              </T>
              {g.rides.map(r => {
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
            </View>
          ))
        )}
      </ScrollView>
    </ScreenFrame>
  );
}
