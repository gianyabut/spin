import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, Animated, Easing } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import type { BikeSource, DiscoveredDevice } from '../ble/BikeSource';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';
import { useSettings } from '../store/settingsStore';

const RADAR = 240; // px

/**
 * Connect — "Pulse Lock-On" radar (lime redesign). The scan/connect behaviour is
 * unchanged (scan on mount, CONNECT → source.connect → remember device); only the
 * presentation is new: a performance-HUD radar that "acquires" and locks onto the
 * S3. Animations are ambient and never gate the connect flow.
 */
export function ConnectScreen({
  source,
  onConnected,
}: {
  source: BikeSource;
  onConnected: () => void;
}) {
  const [device, setDevice] = useState<DiscoveredDevice | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stop = source.scan(setDevice);
    return stop;
  }, [source]);

  // --- ambient radar motion ---
  const sweep = useRef(new Animated.Value(0)).current;
  const ping = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(sweep, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true }),
    ).start();
    Animated.loop(
      Animated.timing(ping, { toValue: 1, duration: 2800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    ).start();
  }, [sweep, ping, glow]);

  const spin = sweep.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const pingScale = ping.interpolate({ inputRange: [0, 1], outputRange: [0.34, 1] });
  const pingOpacity = ping.interpolate({ inputRange: [0, 0.8, 1], outputRange: [0.85, 0, 0] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] });

  const found = !!device;

  return (
    <ScreenFrame style={{ paddingTop: 64, paddingHorizontal: 22, paddingBottom: 30 }}>
      {/* eyebrow + title */}
      <View style={{ alignItems: 'center' }}>
        <T style={{ fontSize: 12, fontWeight: '700', letterSpacing: 2.9, color: found ? colors.accent : colors.muted }}>
          {found ? '● SIGNAL LOCKED' : 'ACQUIRING SIGNAL'}
          {found ? '' : <T style={{ color: colors.accent }}>_</T>}
        </T>
        <T style={{ fontSize: 34, fontWeight: '800', letterSpacing: 0.68, marginTop: 4 }}>FIND YOUR BIKE</T>
      </View>

      {/* radar */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: RADAR, height: RADAR, alignItems: 'center', justifyContent: 'center' }}>
          {/* accent bloom */}
          <Animated.View
            style={{
              position: 'absolute', width: 200, height: 200, borderRadius: 100,
              backgroundColor: colors.accent, opacity: Animated.multiply(glowOpacity, 0.16),
            }}
          />
          {/* rings + crosshair */}
          <Svg width={RADAR} height={RADAR} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
            <Line x1="0" y1="50" x2="100" y2="50" stroke={colors.text} strokeWidth={0.5} opacity={0.07} />
            <Line x1="50" y1="0" x2="50" y2="100" stroke={colors.text} strokeWidth={0.5} opacity={0.07} />
            <Circle cx="50" cy="50" r="49" fill="none" stroke={colors.accent} strokeWidth={0.7} strokeDasharray="2 3" opacity={0.5} />
            <Circle cx="50" cy="50" r="44" fill="none" stroke={colors.surface} strokeWidth={1.4} />
            <Circle cx="50" cy="50" r="30" fill="none" stroke={colors.surface} strokeWidth={1.4} />
          </Svg>

          {/* sweep line (rotates around centre) */}
          <Animated.View
            style={{
              position: 'absolute', width: RADAR, height: RADAR, transform: [{ rotate: spin }],
              alignItems: 'center',
            }}
          >
            <LinearGradient
              colors={['rgba(203,255,60,0)', colors.accent]}
              style={{ position: 'absolute', top: 0, width: 2, height: RADAR / 2 }}
            />
          </Animated.View>

          {/* ping */}
          <Animated.View
            style={{
              position: 'absolute', width: RADAR, height: RADAR, borderRadius: RADAR / 2,
              borderWidth: 2, borderColor: colors.accent,
              transform: [{ scale: pingScale }], opacity: pingOpacity,
            }}
          />

          {/* core */}
          <Animated.View
            style={{
              width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center',
              backgroundColor: found ? colors.accent : colors.surface,
              shadowColor: colors.accent, shadowOpacity: found ? 0.6 : 0, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
            }}
          >
            <T style={{ fontSize: 31, fontWeight: '800', color: found ? colors.onAccent : colors.muted, lineHeight: 31 }}>S3</T>
            <T style={{ fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: found ? colors.onAccent : colors.muted }}>
              {found ? 'LOCKED' : 'SEEK'}
            </T>
          </Animated.View>

          {/* HUD corners */}
          <T style={hud('tl')}>FTMS · 0x1826</T>
          <T style={hud('tr', found ? colors.accent : colors.muted)}>{found ? '98%' : '—'}</T>
          <T style={hud('bl')}>2.4 GHZ</T>
          <T style={hud('br')}>{found ? '−41 dBm' : 'SCAN…'}</T>
        </View>
      </View>

      {/* target readout */}
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <T style={{ fontSize: 22, fontWeight: '800', letterSpacing: 0.4, color: found ? colors.text : colors.muted }}>
          {device ? device.name : 'SEARCHING…'}
        </T>
        {found && (
          <T style={{ fontSize: 11, fontWeight: '800', letterSpacing: 2.6, color: colors.accent, marginTop: 4 }}>
            TARGET ACQUIRED · READY
          </T>
        )}
      </View>

      {/* connection error (surfaced from the BLE layer for diagnostics) */}
      {error && (
        <T style={{ fontSize: 13, fontWeight: '600', letterSpacing: 0.5, color: colors.accent, marginBottom: 12, textAlign: 'center' }}>
          CONNECT FAILED — {error}
        </T>
      )}

      {/* CONNECT — enabled once a device is found */}
      <Pressable
        disabled={!found || connecting}
        onPress={async () => {
          if (!device) return;
          setError(null);
          setConnecting(true);
          try {
            await source.connect(device.id);
            useSettings.getState().setLastDevice(device.id);
            onConnected();
          } catch (e: any) {
            setError(e?.message ?? 'unknown error');
          } finally {
            setConnecting(false);
          }
        }}
        style={({ pressed }) => ({
          backgroundColor: found ? colors.accent : colors.surface,
          paddingVertical: 16,
          opacity: connecting ? 0.6 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <T
          style={{
            textAlign: 'center',
            color: found ? colors.onAccent : colors.muted,
            fontSize: 18,
            fontWeight: '800',
            letterSpacing: 2.7,
          }}
        >
          {connecting ? 'CONNECTING…' : found ? 'CONNECT' : 'LOCKING ON…'}
        </T>
      </Pressable>
    </ScreenFrame>
  );
}

// HUD label positioning inside the radar box.
function hud(corner: 'tl' | 'tr' | 'bl' | 'br', color: string = colors.muted) {
  const base = { position: 'absolute' as const, fontSize: 10, fontWeight: '700' as const, letterSpacing: 1.2, color };
  const pos = {
    tl: { top: 4, left: 2 },
    tr: { top: 4, right: 2 },
    bl: { bottom: 4, left: 2 },
    br: { bottom: 4, right: 2 },
  }[corner];
  return { ...base, ...pos };
}
