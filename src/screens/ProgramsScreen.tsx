import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useBike } from '../store/bikeStore';
import { PROGRAMS, totalDur } from '../engine/programs';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';
import type { Program } from '../engine/types';

/**
 * Programs — faithful port of the finalized prototype
 * (design/Yesoul PULSE App.dc.html lines 169–191). One card per program in
 * PROGRAMS: name 26/800 + total-minutes meta, desc line, an intensity strip
 * (one bar per segment), and an orange START button. START seeds the session
 * via startRide(program) then calls onStartRide (navigation is wired by the
 * nav task). Letter-spacing em values are converted to px (em × fontSize).
 *
 * Intensity strip bar math (exact prototype formulas):
 *   flexGrow = max(1, round(seg.dur / 30))
 *   height   = round(4 + (seg.res / 20) * 18) px
 */
export function ProgramsScreen({ onStartRide }: { onStartRide: () => void }) {
  const start = (p: Program) => {
    useBike.getState().startRide(p);
    onStartRide();
  };

  return (
    <ScreenFrame>
      <ScrollView contentContainerStyle={{ paddingTop: 64, paddingHorizontal: 22, paddingBottom: 12 }}>
        {/* Title — 34 / 800 */}
        <T style={{ fontSize: 34, fontWeight: '800' }}>PROGRAMS</T>

        {/* Sub — 14 / 600 / .15em (2.1px) / muted */}
        <T style={{ fontSize: 14, fontWeight: '600', letterSpacing: 2.1, color: colors.muted, marginTop: 2 }}>
          STRUCTURED INTERVALS FOR THE S3
        </T>

        {/* Cards — column, gap 12 */}
        <View style={{ marginTop: 18, gap: 12 }}>
          {PROGRAMS.map(p => {
            const min = Math.round(totalDur(p) / 60);
            return (
              <View key={p.id} style={{ borderWidth: 2, borderColor: colors.surface, padding: 16 }}>
                {/* Header — name 26/800 left, total-min meta 15/700 muted right */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <T style={{ fontSize: 26, fontWeight: '800', lineHeight: 26 }}>{p.name}</T>
                  <T style={{ fontSize: 15, fontWeight: '700', color: colors.muted }}>{`${min} MIN`}</T>
                </View>

                {/* Desc — 14 / .1em (1.4px) / muted */}
                <T style={{ fontSize: 14, letterSpacing: 1.4, color: colors.muted, marginTop: 4 }}>{p.desc}</T>

                {/* Intensity strip — one bar per segment; gap 3; 22px tall; bars bottom-aligned */}
                <View style={{ flexDirection: 'row', gap: 3, marginTop: 12, height: 22, alignItems: 'flex-end' }}>
                  {p.segs.map((seg, i) => (
                    <View
                      key={i}
                      style={{
                        flexGrow: Math.max(1, Math.round(seg.dur / 30)),
                        flexBasis: 0,
                        height: Math.round(4 + (seg.res / 20) * 18),
                        backgroundColor: colors.surface,
                      }}
                    />
                  ))}
                </View>

                {/* START — solid orange block, dark text, 15/800/.15em (2.25px) */}
                <Pressable
                  onPress={() => start(p)}
                  style={{ marginTop: 14, backgroundColor: colors.accent, paddingVertical: 10 }}
                >
                  <T
                    style={{
                      color: colors.onAccent,
                      textAlign: 'center',
                      fontSize: 15,
                      fontWeight: '800',
                      letterSpacing: 2.25,
                    }}
                  >
                    START
                  </T>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenFrame>
  );
}
