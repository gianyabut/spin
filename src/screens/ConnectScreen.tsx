import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import type { BikeSource, DiscoveredDevice } from '../ble/BikeSource';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';
import { useSettings } from '../store/settingsStore';

// Port of the finalized prototype's Connect screen
// (design/Yesoul PULSE App.dc.html lines 18–41). Values transcribed verbatim;
// letter-spacing em values are converted to px (em × fontSize).
export function ConnectScreen({
  source,
  onConnected,
}: {
  source: BikeSource;
  onConnected: () => void;
}) {
  const [device, setDevice] = useState<DiscoveredDevice | null>(null);

  useEffect(() => {
    const stop = source.scan(setDevice);
    return stop;
  }, [source]);

  return (
    <ScreenFrame style={{ paddingTop: 68, paddingHorizontal: 22, paddingBottom: 30 }}>
      {/* Title — 44 / 800 / line-height 1 / letter-spacing .01em */}
      <T style={{ fontSize: 44, fontWeight: '800', lineHeight: 44, letterSpacing: 0.44 }}>
        CONNECT{'\n'}YOUR BIKE
      </T>

      {/* Scanning subline — 15 / 600 / .12em / muted, blinking orange cursor */}
      <T
        style={{
          fontSize: 15,
          fontWeight: '600',
          letterSpacing: 1.8,
          color: colors.muted,
          marginTop: 8,
        }}
      >
        SCANNING FOR BLUETOOTH FTMS
        <T style={{ color: colors.accent }}>_</T>
      </T>

      {/* Concentric scan rings — 140 / 96 / 54, inner solid-orange SCAN disc */}
      <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 34 }}>
        <View
          style={{
            width: 140,
            height: 140,
            borderWidth: 2,
            borderColor: colors.surface,
            borderRadius: 70,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderWidth: 2,
              borderColor: colors.surface,
              borderRadius: 48,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 54,
                height: 54,
                backgroundColor: colors.accent,
                borderRadius: 27,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <T
                style={{
                  fontSize: 13,
                  fontWeight: '800',
                  letterSpacing: 1.3,
                  color: colors.onAccent,
                }}
              >
                SCAN
              </T>
            </View>
          </View>
        </View>
      </View>

      {device ? (
        <>
          {/* Eyebrow — 13 / 600 / .2em / muted */}
          <T
            style={{
              fontSize: 13,
              fontWeight: '600',
              letterSpacing: 2.6,
              color: colors.muted,
              marginBottom: 10,
            }}
          >
            1 DEVICE FOUND
          </T>

          {/* Device row — 2px orange border */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: colors.accent,
              padding: 16,
            }}
          >
            <View>
              <T style={{ fontSize: 20, fontWeight: '700' }}>{device.name}</T>
              <T
                style={{
                  fontSize: 13,
                  letterSpacing: 1.3,
                  color: colors.muted,
                  marginTop: 2,
                }}
              >
                SMART BIKE · FTMS
              </T>
            </View>

            {/* Signal bars — 5px wide, heights 8/13/18/23, first three orange */}
            <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end' }}>
              <View style={{ width: 5, height: 8, backgroundColor: colors.accent }} />
              <View style={{ width: 5, height: 13, backgroundColor: colors.accent }} />
              <View style={{ width: 5, height: 18, backgroundColor: colors.accent }} />
              <View style={{ width: 5, height: 23, backgroundColor: colors.surface }} />
            </View>
          </View>

          <View style={{ flex: 1 }} />

          {/* Full-width orange CONNECT button — 18 / 800 / .15em, press scale .98 */}
          <Pressable
            onPress={async () => {
              await source.connect(device.id);
              useSettings.getState().setLastDevice(device.id); // remember for next-launch auto-reconnect
              onConnected();
            }}
            style={({ pressed }) => ({
              backgroundColor: colors.accent,
              paddingVertical: 16,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            })}
          >
            <T
              style={{
                textAlign: 'center',
                color: colors.onAccent,
                fontSize: 18,
                fontWeight: '800',
                letterSpacing: 2.7,
              }}
            >
              CONNECT
            </T>
          </Pressable>
        </>
      ) : (
        // While scanning — hint in #332E36 (surface)
        <T
          style={{
            fontSize: 13,
            fontWeight: '600',
            letterSpacing: 2.6,
            color: colors.surface,
            textAlign: 'center',
          }}
        >
          MAKE SURE THE BIKE CONSOLE IS AWAKE
        </T>
      )}
    </ScreenFrame>
  );
}
