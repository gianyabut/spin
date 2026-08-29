import React from 'react';
import { View, Pressable } from 'react-native';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';

/**
 * Custom bottom tab bar — faithful port of the finalized prototype
 * (design/Yesoul PULSE App.dc.html lines 214–221). 2px `#241f27` (rule) top
 * border, four equal-flex tabs, active = accent orange, inactive = muted,
 * labels 14 / 700 / .15em tracking (.15em × 14 = 2.1px). Presentational only:
 * routing state is owned by RootNavigator. Hidden entirely during a ride —
 * RootNavigator simply does not render it when a session/summary is active.
 */
export type TabKey = 'home' | 'rides' | 'programs' | 'profile';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: 'HOME' },
  { key: 'rides', label: 'RIDES' },
  { key: 'programs', label: 'PROGRAMS' },
  { key: 'profile', label: 'PROFILE' },
];

export function TabBar({ active, onSelect }: { active: TabKey; onSelect: (k: TabKey) => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        borderTopWidth: 2,
        borderTopColor: colors.rule,
        paddingTop: 12,
        paddingBottom: 26,
        backgroundColor: colors.bg,
      }}
    >
      {TABS.map(t => (
        <Pressable key={t.key} onPress={() => onSelect(t.key)} style={{ flex: 1 }}>
          <T
            style={{
              textAlign: 'center',
              fontSize: 14,
              fontWeight: '700',
              letterSpacing: 2.1,
              color: t.key === active ? colors.accent : colors.muted,
            }}
          >
            {t.label}
          </T>
        </Pressable>
      ))}
    </View>
  );
}
