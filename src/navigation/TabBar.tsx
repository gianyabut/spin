import React from 'react';
import { View, Pressable } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors } from '../ui/tokens';

/**
 * Custom bottom tab bar — "glow capsule" (futuristic redesign). A floating,
 * rounded capsule that overlays screen content; the active tab sits inside a
 * glowing lime disc, inactive tabs are muted icons. Icon-forward for a clean,
 * modern HUD feel. Deliberately rounded (a step past the app's 0-radius rule)
 * for the floating look.
 *
 * Tappability: each tab is a full-height, flex:1 column with hitSlop, so the
 * whole cell is a target (the old text-only bar had a ~17px tap strip).
 *
 * Presentational only: routing state is owned by RootNavigator, which reserves
 * bottom space so content clears the floating bar. Hidden during a ride.
 */
export type TabKey = 'home' | 'rides' | 'programs' | 'profile';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'home', label: 'HOME' },
  { key: 'rides', label: 'RIDES' },
  { key: 'programs', label: 'PROGRAMS' },
  { key: 'profile', label: 'PROFILE' },
];

function Icon({ name, color }: { name: TabKey; color: string }) {
  const p = { stroke: color, strokeWidth: 2, fill: 'none' as const };
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {name === 'home' && (<>
        <Path d="M3 11l9-8 9 8" {...p} strokeLinejoin="round" />
        <Path d="M5 10v10h14V10" {...p} strokeLinejoin="round" />
      </>)}
      {name === 'rides' && (<>
        <Path d="M4 20V10M10 20V4M16 20v-7" {...p} strokeLinecap="round" />
        <Path d="M2 20h20" {...p} strokeLinecap="round" />
      </>)}
      {name === 'programs' && (<>
        <Rect x="3" y="3" width="7" height="7" {...p} />
        <Rect x="14" y="3" width="7" height="7" {...p} />
        <Rect x="3" y="14" width="7" height="7" {...p} />
        <Rect x="14" y="14" width="7" height="7" {...p} />
      </>)}
      {name === 'profile' && (<>
        <Circle cx="12" cy="8" r="4" {...p} />
        <Path d="M4 21c0-4 4-6 8-6s8 2 8 6" {...p} strokeLinecap="round" />
      </>)}
    </Svg>
  );
}

export function TabBar({ active, onSelect }: { active: TabKey; onSelect: (k: TabKey) => void }) {
  return (
    <View
      testID="tab-bar"
      style={{
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: 26,
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(20,22,15,0.94)',
        borderRadius: 34,
        borderWidth: 1.5,
        borderColor: '#343829',
        // ambient lift
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
      }}
    >
      {TABS.map(t => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            testID={`tab-${t.key}`}
            onPress={() => onSelect(t.key)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: on }}
            style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            {on ? (
              <View
                style={{
                  width: 46, height: 46, borderRadius: 23,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: colors.accent,
                  // lime glow
                  shadowColor: colors.accent,
                  shadowOpacity: 0.6,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 8,
                }}
              >
                <Icon name={t.key} color={colors.onAccent} />
              </View>
            ) : (
              <Icon name={t.key} color={colors.muted} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
