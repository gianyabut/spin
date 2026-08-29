import React from 'react';
import { View } from 'react-native';
import { colors } from '../tokens';
import { T } from '../text';

/**
 * THIS WEEK bar chart — faithful port of the prototype's Home markup
 * (design/Yesoul PULSE App.dc.html lines 63–75). Seven flex bars over an 80px
 * track (8px gaps): ridden days are solid-orange columns at varying heights,
 * rest days are 8%-height surface stubs, and TODAY is a 2px-dashed outline bar.
 * The prototype hardcodes the week's shape, so we mirror those values here.
 */
type Bar = { pct: number; kind: 'done' | 'rest' | 'today'; label: string };

const WEEK: Bar[] = [
  { pct: 55, kind: 'done', label: 'MO' },
  { pct: 80, kind: 'done', label: 'TU' },
  { pct: 8, kind: 'rest', label: 'WE' },
  { pct: 65, kind: 'done', label: 'TH' },
  { pct: 100, kind: 'done', label: 'FR' },
  { pct: 8, kind: 'rest', label: 'SA' },
  { pct: 40, kind: 'today', label: 'TODAY' },
];

export function Bars() {
  return (
    <View>
      {/* Bar track — 80px tall, 8px gaps, bars grow from the baseline. */}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 80 }}>
        {WEEK.map((b, i) => (
          <View
            key={i}
            style={{
              flex: 1,
              height: `${b.pct}%`,
              backgroundColor: b.kind === 'today' ? 'transparent' : b.kind === 'rest' ? colors.surface : colors.accent,
              borderWidth: b.kind === 'today' ? 2 : 0,
              borderStyle: 'dashed',
              borderColor: colors.surface,
            }}
          />
        ))}
      </View>
      {/* Day labels — 12 / .1em (1.2px) / muted; TODAY is orange. */}
      <View style={{ flexDirection: 'row', gap: 8, paddingTop: 6 }}>
        {WEEK.map((b, i) => (
          <T
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 12,
              letterSpacing: 1.2,
              color: b.kind === 'today' ? colors.accent : colors.muted,
            }}
          >
            {b.label}
          </T>
        ))}
      </View>
    </View>
  );
}
