import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { colors } from './tokens';

// On iOS, expo-font registers each Barlow Condensed weight under its OWN family
// name; a single family + numeric fontWeight will NOT select the right face.
// Screens pass numeric fontWeight (500/600/700/800) in their styles, so map the
// effective weight → the correct loaded family centrally here. Families are
// registered via @expo-google-fonts/barlow-condensed in App.tsx (Task 6.1);
// not present in tests → React Native falls back to the system font (no throw).
function familyForWeight(weight: TextStyle['fontWeight']): string {
  switch (weight) {
    case '800':
    case 800:
    case '900':
    case 900:
    case 'bold':
      return 'BarlowCondensed_800ExtraBold';
    case '700':
    case 700:
      return 'BarlowCondensed_700Bold';
    case '600':
    case 600:
      return 'BarlowCondensed_600SemiBold';
    case '500':
    case 500:
    default:
      return 'BarlowCondensed_500Medium';
  }
}

export function T({ style, ...p }: TextProps) {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontFamily = familyForWeight(flat?.fontWeight);
  // fontFamily + color go UNDER the passed style so size/color still come
  // through; the now-redundant numeric fontWeight is harmless.
  return <Text {...p} style={[{ fontFamily, color: colors.text }, style]} />;
}

export const styles = StyleSheet.create({}); // reserved
