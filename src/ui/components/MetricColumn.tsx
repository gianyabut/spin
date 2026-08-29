import React from 'react';
import { View } from 'react-native';
import { colors } from '../tokens';
import { T } from '../text';

/**
 * One column of the Live Ride metrics row (design/Yesoul PULSE App.dc.html
 * lines 115–118). Fixed min-width 70 so numbers update in place without
 * layout shift. Value 36 / 700; label 13 / .2em (2.6px) / muted.
 */
export function MetricColumn({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', minWidth: 70 }}>
      <T style={{ fontSize: 36, fontWeight: '700' }}>{value}</T>
      <T style={{ fontSize: 13, letterSpacing: 2.6, color: colors.muted }}>{label}</T>
    </View>
  );
}
