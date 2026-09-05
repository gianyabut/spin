import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useBike } from '../store/bikeStore';
import { PROGRAMS, totalDur } from '../engine/programs';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';
import type { Program } from '../engine/types';

// Cycling imagery matched to each program's character.
const PHOTOS: Record<string, any> = {
  hiit30: require('../../assets/photos/ride-hero.jpg'),
  end45: require('../../assets/photos/prog-endurance.jpg'),
  pyr20: require('../../assets/photos/prog-pyramid.jpg'),
};
const FALLBACK = require('../../assets/photos/ride-hero.jpg');

/**
 * Programs — "photo tiles" (lime redesign). Each program is a cinematic graded
 * cycling tile (image matched to the workout) with a left scrim, minutes eyebrow,
 * name, description and a START action. START seeds the session via
 * startRide(program) then calls onStartRide (unchanged behaviour).
 */
export function ProgramsScreen({ onStartRide }: { onStartRide: () => void }) {
  const start = (p: Program) => {
    useBike.getState().startRide(p);
    onStartRide();
  };

  return (
    <ScreenFrame>
      <ScrollView contentContainerStyle={{ paddingTop: 64, paddingHorizontal: 22, paddingBottom: 24 }}>
        <T style={{ fontSize: 33, fontWeight: '800' }}>PROGRAMS</T>
        <T style={{ fontSize: 13, fontWeight: '600', letterSpacing: 2.1, color: colors.muted, marginTop: 2 }}>
          STRUCTURED INTERVALS FOR THE S3
        </T>

        <View style={{ marginTop: 16, gap: 12 }}>
          {PROGRAMS.map(p => {
            const min = Math.round(totalDur(p) / 60);
            return (
              <View key={p.id} style={{ height: 158, overflow: 'hidden', justifyContent: 'flex-end', padding: 15 }}>
                <Image source={PHOTOS[p.id] ?? FALLBACK} contentFit="cover" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                <LinearGradient
                  colors={['rgba(9,11,7,0.9)', 'rgba(9,11,7,0.35)', 'rgba(9,11,7,0.12)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <LinearGradient
                  colors={['rgba(9,11,7,0)', 'rgba(9,11,7,0.55)']}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <T style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1.8, color: colors.accent }}>{min} MIN</T>
                <T style={{ fontSize: 28, fontWeight: '800', lineHeight: 27, marginTop: 3 }}>{p.name}</T>
                <T style={{ fontSize: 12, fontWeight: '600', letterSpacing: 1, color: colors.text, opacity: 0.9, marginTop: 3 }}>{p.desc}</T>

                <Pressable
                  onPress={() => start(p)}
                  style={({ pressed }) => ({
                    position: 'absolute', right: 15, bottom: 15,
                    backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 8,
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  })}
                >
                  <T style={{ color: colors.onAccent, fontSize: 14, fontWeight: '800', letterSpacing: 1.8 }}>START</T>
                  <T style={{ color: colors.onAccent, fontSize: 14, fontWeight: '800' }}>→</T>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenFrame>
  );
}
