import React, { useRef, useState } from 'react';
import { View, Pressable, TextInput } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';
import { useSettings } from '../store/settingsStore';

/**
 * Welcome — first-run onboarding, "Pulse Rider Setup" HUD (lime redesign,
 * direction B). Cohesive with the Connect radar: pure dark, a faint telemetry
 * grid, an accent bloom + vignette for depth, and the rider's name rendered in
 * giant lime as they type. Shown only when no name is saved yet.
 *
 * Skippable: SKIP (or LET'S RIDE with an empty field) finishes without saving,
 * so the greeting falls back to RIDER. LET'S RIDE with text saves the trimmed
 * name. Either way onDone() dismisses onboarding (RootNavigator won't re-show it).
 */
export function WelcomeScreen({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  // Mirror the input in a ref so finish() always reads the latest value, even
  // when called in the same tick as a change (test harness / fast taps) before
  // a re-render commits.
  const nameRef = useRef('');
  const onChange = (t: string) => { nameRef.current = t; setName(t); };

  const finish = () => {
    const trimmed = nameRef.current.trim();
    if (trimmed) useSettings.getState().setName(trimmed);
    onDone();
  };

  return (
    <ScreenFrame>
      {/* telemetry grid (depth) — fixed-size Svg (no percentage layout measure) */}
      <Svg width={440} height={950} style={{ position: 'absolute', top: 0, left: 0 }} pointerEvents="none">
        {Array.from({ length: 28 }).map((_, i) => (
          <Line key={`h${i}`} x1="0" y1={i * 34} x2="440" y2={i * 34} stroke={colors.rule} strokeWidth={1} />
        ))}
        {Array.from({ length: 13 }).map((_, i) => (
          <Line key={`v${i}`} x1={i * 34} y1="0" x2={i * 34} y2="950" stroke={colors.rule} strokeWidth={1} />
        ))}
      </Svg>
      {/* accent bloom */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', top: 150, alignSelf: 'center',
          width: 260, height: 260, borderRadius: 130, backgroundColor: colors.accent, opacity: 0.13,
        }}
      />

      {/* HUD corners */}
      <T style={{ position: 'absolute', top: 60, left: 22, fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: colors.muted }}>
        PULSE · RIDER SETUP
      </T>
      <Pressable onPress={onDone} hitSlop={12} style={{ position: 'absolute', top: 56, right: 20 }}>
        <T style={{ fontSize: 13, fontWeight: '800', letterSpacing: 2.2, color: colors.muted }}>SKIP</T>
      </Pressable>

      {/* centre block */}
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 26 }}>
        <T style={{ fontSize: 12, fontWeight: '800', letterSpacing: 3.4, color: colors.muted, textAlign: 'center' }}>
          WELCOME TO <T style={{ color: colors.accent }}>PULSE</T>
        </T>
        <T style={{ fontSize: 40, fontWeight: '800', lineHeight: 38, letterSpacing: 0.4, textAlign: 'center', marginTop: 10 }}>
          WHAT'S{'\n'}YOUR NAME?
        </T>

        <View style={{ alignItems: 'center', marginTop: 38 }}>
          <TextInput
            testID="name-input"
            value={name}
            onChangeText={onChange}
            onSubmitEditing={finish}
            placeholder="YOUR NAME"
            placeholderTextColor={colors.surface}
            autoCapitalize="characters"
            returnKeyType="done"
            maxLength={20}
            style={{
              fontFamily: 'BarlowCondensed_800ExtraBold',
              fontSize: 44,
              color: colors.accent,
              textAlign: 'center',
              letterSpacing: 1,
              minWidth: 200,
              padding: 0,
            }}
          />
          <View style={{ marginTop: 8, width: 200, height: 2, backgroundColor: colors.surface }} />
          <T style={{ marginTop: 12, fontSize: 12, fontWeight: '700', letterSpacing: 2.2, color: colors.muted }}>
            TAP TO ENTER · OR SKIP
          </T>
        </View>
      </View>

      {/* LET'S RIDE — saves the name (or acts as skip when empty) */}
      <View style={{ paddingHorizontal: 26, paddingBottom: 34 }}>
        <Pressable
          onPress={finish}
          style={({ pressed }) => ({
            backgroundColor: colors.accent, paddingVertical: 16,
            flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
        >
          <T style={{ color: colors.onAccent, fontSize: 20, fontWeight: '800', letterSpacing: 2.6 }}>LET'S RIDE</T>
          <T style={{ color: colors.onAccent, fontSize: 22, fontWeight: '800' }}>→</T>
        </Pressable>
      </View>
    </ScreenFrame>
  );
}
