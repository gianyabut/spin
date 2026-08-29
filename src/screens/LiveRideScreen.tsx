import React from 'react';
import { View, Pressable } from 'react-native';
import { useBike } from '../store/bikeStore';
import { useSettings } from '../store/settingsStore';
import { currentSegment, resCue } from '../engine/rideEngine';
import { convDist, convSpeed, distLabel, speedLabel } from '../engine/formulas';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';
import { ScreenFrame } from '../ui/components/ScreenFrame';
import { MetricColumn } from '../ui/components/MetricColumn';

// mm:ss — mirrors the prototype's `fmt(sec)` (design HTML line 295).
export function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}

/**
 * Live Ride dashboard — faithful port of the finalized prototype
 * (design/Yesoul PULSE App.dc.html lines 84–125). Display strings mirror the
 * prototype's `renderVals` (lines 318–333), reusing engine helpers. Letter-
 * spacing em values are converted to px (em × fontSize).
 */
export function LiveRideScreen({ onEnd }: { onEnd: () => void }) {
  const session = useBike(s => s.session);
  const resInc = useBike(s => s.resInc);
  const resDec = useBike(s => s.resDec);
  const setPaused = useBike(s => s.setPaused);
  const canControl = useBike(s => s.source.capabilities.control);
  const units = useSettings(s => s.units);

  if (!session) return <ScreenFrame style={{ paddingTop: 64, paddingBottom: 30 }}>{null}</ScreenFrame>;

  const seg = currentSegment(session);
  const hasProgram = !!session.program;
  const totalDur = session.program
    ? session.program.segs.reduce((a, g) => a + g.dur, 0)
    : 0;

  // Header (line 318–319)
  const rideMode = session.program
    ? `${session.program.name} · INTERVAL ${session.segIdx + 1}/${session.program.segs.length}`
    : 'FREE RIDE';
  const rideClock = session.program
    ? fmt(Math.max(0, totalDur - session.elapsed)) + ' LEFT'
    : fmt(session.elapsed);

  // Phase banner (line 322–323): work = accent bg / dark text; recover/
  // warmup/cooldown = #241f27 bg / light text.
  const isRecover =
    !!seg && (seg.label === 'RECOVER' || seg.label === 'COOL DOWN' || seg.label === 'WARM UP');
  const bannerBg = isRecover ? colors.rule : colors.accent;
  const bannerFg = isRecover ? colors.text : colors.onAccent;

  // Hero + resistance + metrics (lines 324–331)
  const cadence = Math.round(session.cadence);
  const targetLabel = seg ? `RPM · TARGET ${seg.lo}–${seg.hi}` : 'RPM · FIND YOUR RHYTHM';
  const resistanceLabel = 'RESISTANCE ' + session.resistance;
  const speedFmt = convSpeed(session.speedKmh, units).toFixed(1);
  const distFmt = convDist(session.distanceKm, units).toFixed(1);
  const calFmt = String(Math.round(session.calories));
  const elapsedFmt = fmt(session.elapsed);
  const pauseLabel = session.paused ? 'RESUME' : 'PAUSE';

  return (
    <ScreenFrame style={{ paddingTop: 64, paddingBottom: 30 }}>
      {/* Header — mode left / clock right, 15 / 600 / muted */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          paddingHorizontal: 22,
        }}
      >
        <T style={{ fontSize: 15, fontWeight: '600', letterSpacing: 0.75, color: colors.muted }}>
          {rideMode}
        </T>
        <T style={{ fontSize: 15, fontWeight: '600', color: colors.muted }}>{rideClock}</T>
      </View>

      {/* Program-only interval progress bar + phase banner */}
      {hasProgram && session.program && (
        <>
          <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 22, paddingTop: 12 }}>
            {session.program.segs.map((g, i) => (
              <View
                key={i}
                style={{
                  flexGrow: Math.max(1, Math.round(g.dur / 30)),
                  flexBasis: 0,
                  height: 6,
                  backgroundColor:
                    i < session.segIdx
                      ? colors.accent
                      : i === session.segIdx
                      ? colors.text
                      : colors.surface,
                }}
              />
            ))}
          </View>
          <View
            style={{
              backgroundColor: bannerBg,
              marginTop: 18,
              marginHorizontal: 22,
              paddingVertical: 10,
              paddingHorizontal: 16,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <T style={{ fontSize: 20, fontWeight: '800', letterSpacing: 1.2, color: bannerFg }}>
              {seg ? seg.label : ''}
            </T>
            <T style={{ fontSize: 20, fontWeight: '800', color: bannerFg }}>
              {seg ? fmt(seg.dur - session.segElapsed) : ''}
            </T>
          </View>
        </>
      )}

      {/* PAUSED outlined banner — 2px off-white border, 16 / 800 / .3em */}
      {session.paused && (
        <View
          style={{
            marginTop: 14,
            marginHorizontal: 22,
            borderWidth: 2,
            borderColor: colors.text,
            paddingVertical: 8,
          }}
        >
          <T
            style={{
              textAlign: 'center',
              fontSize: 16,
              fontWeight: '800',
              letterSpacing: 4.8,
            }}
          >
            PAUSED
          </T>
        </View>
      )}

      {/* Cadence hero — 200 / 800 / lh .95 / -.01em, target label below */}
      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <T
          style={{
            fontSize: 200,
            fontWeight: '800',
            lineHeight: 190,
            letterSpacing: -2,
          }}
        >
          {cadence}
        </T>
        <T
          style={{
            fontSize: 17,
            fontWeight: '600',
            letterSpacing: 5.1,
            color: colors.muted,
            marginTop: -4,
            textAlign: 'center',
          }}
        >
          {targetLabel}
        </T>
      </View>

      {/* Resistance segmented control — [−] RESISTANCE n ▲/▼ [+] */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'stretch',
          marginTop: 16,
        }}
      >
        <Pressable
          onPress={resDec}
          style={({ pressed }) => ({
            borderWidth: 2,
            borderColor: colors.surface,
            borderRightWidth: 0,
            paddingVertical: 6,
            paddingHorizontal: 18,
            justifyContent: 'center',
            backgroundColor: pressed ? colors.surface : 'transparent',
          })}
        >
          <T style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>−</T>
        </Pressable>
        <View
          style={{
            borderWidth: 2,
            borderColor: colors.accent,
            paddingVertical: 6,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <T style={{ color: colors.accent, fontSize: 17, fontWeight: '700', letterSpacing: 1.7 }}>
            {resistanceLabel}
            {resCue(session)}
          </T>
        </View>
        <Pressable
          onPress={resInc}
          style={({ pressed }) => ({
            borderWidth: 2,
            borderColor: colors.surface,
            borderLeftWidth: 0,
            paddingVertical: 6,
            paddingHorizontal: 18,
            justifyContent: 'center',
            backgroundColor: pressed ? colors.surface : 'transparent',
          })}
        >
          <T style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>+</T>
        </Pressable>
      </View>

      {/* Read-only note — shown only when the bike can't accept resistance writes.
          The +/− still move the local target (▲/▼ cue), but the rider adjusts the
          knob by hand. Muted eyebrow, matches the design's UPPERCASE label tone. */}
      {!canControl && (
        <T
          style={{
            textAlign: 'center',
            fontSize: 13,
            fontWeight: '600',
            letterSpacing: 2.6,
            color: colors.muted,
            marginTop: 8,
          }}
        >
          MANUAL RESISTANCE · ADJUST ON BIKE
        </T>
      )}

      <View style={{ flex: 1 }} />

      {/* Metrics row — speed / dist / kcal / time */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingHorizontal: 22,
          paddingBottom: 16,
        }}
      >
        <MetricColumn value={speedFmt} label={speedLabel(units)} />
        <MetricColumn value={distFmt} label={distLabel(units)} />
        <MetricColumn value={calFmt} label="KCAL" />
        <MetricColumn value={elapsedFmt} label="TIME" />
      </View>

      {/* Controls — PAUSE / END */}
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 22 }}>
        <Pressable
          onPress={setPaused}
          style={{
            flex: 1,
            borderWidth: 2,
            borderColor: colors.surface,
            paddingVertical: 14,
          }}
        >
          <T
            style={{
              textAlign: 'center',
              fontSize: 16,
              fontWeight: '700',
              letterSpacing: 2.4,
            }}
          >
            {pauseLabel}
          </T>
        </Pressable>
        <Pressable
          onPress={() => {
            useBike.getState().endRide();
            onEnd();
          }}
          style={{
            flex: 1,
            backgroundColor: colors.text,
            paddingVertical: 14,
          }}
        >
          <T
            style={{
              textAlign: 'center',
              color: colors.onAccent,
              fontSize: 16,
              fontWeight: '700',
              letterSpacing: 2.4,
            }}
          >
            END
          </T>
        </Pressable>
      </View>
    </ScreenFrame>
  );
}
