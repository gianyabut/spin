import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors } from './tokens';

// Registered via expo-font in App.tsx (Task 6.x). Not present in tests →
// React Native gracefully falls back to the system font (never throws).
const F = 'BarlowCondensed';

export function T({ style, ...p }: TextProps) {
  return <Text {...p} style={[{ fontFamily: F, color: colors.text }, style]} />;
}

export const styles = StyleSheet.create({}); // reserved
