import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { colors } from '../tokens';

/**
 * Dark full-bleed frame for every screen. Uses a plain padded View (no
 * SafeAreaView) so it renders without a SafeAreaProvider in tests; the
 * prototype's fixed top padding already clears the status bar. Screens pass
 * their own padding via `style` (e.g. Connect: 68/22/30).
 */
export function ScreenFrame({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ flex: 1, minHeight: 0, backgroundColor: colors.bg }, style]}>
      {children}
    </View>
  );
}
