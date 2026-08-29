# Yesoul PULSE — Design Spec

**Date:** 2026-08-29
**Status:** Approved for planning
**Target:** iOS (iPhone), React Native + Expo, real Bluetooth FTMS first
**Build/dev environment:** macOS (Xcode + Expo). This repo is authored on Windows and pushed for the Mac to develop against.

---

## 1. Overview

PULSE is a single-rider mobile companion app for a **Yesoul S3** spin bike, connecting over **Bluetooth LE (FTMS)**. It replaces the paid Yesoul app for one person: pair with the bike, ride free or follow structured interval programs, watch live metrics (cadence, resistance, speed, distance, calories, time), and review ride history and weekly goals.

The visual design is **already finalized** in the handoff bundle and is the pixel-perfect source of truth:
- `design/Yesoul PULSE App.dc.html` — interactive prototype of all 7 screens (the mockup).
- `design/README.md` — every design token, type scale, and per-screen spec.
- `design/Yesoul Spin App Mockups.dc.html` — earlier exploration (direction **1b PULSE** chosen).

**This spec does not redesign anything.** Porting the UI is transcription. The engineering effort is in the four areas the mockups do **not** cover: BLE/FTMS integration, the ride engine + state, local persistence, and the iOS build.

### Goals
- Faithful, high-fidelity port of the 7 prototype screens to React Native.
- Live ride dashboard driven by **real FTMS data** from the S3.
- Structured interval programs with auto-advance (ship with 3, allow user-defined later).
- Local persistence of ride history, settings, and last-paired device.
- A clean hardware/UI seam so the ride logic is testable without the bike.

### Non-goals (this version)
- Android, tablet, or web targets.
- Cloud sync, accounts, social features.
- Strava export (UI shows "COMING SOON" only).
- User-authored programs (architecture allows it; UI ships later).
- Background/locked-screen ride tracking (portrait, screen-on assumed).

---

## 2. Platform & build decisions

| Decision | Choice | Rationale |
|---|---|---|
| Platform | **iOS only** | Rider's phone; single-target keeps scope tight. |
| Framework | **React Native + Expo (dev client)** | Best BLE library support (`react-native-ble-plx`), strong ecosystem, Mac build via Xcode/EAS. |
| BLE library | **`react-native-ble-plx`** | Mature FTMS-capable BLE central; not Expo-Go compatible → requires a **dev client** build. |
| Dev/build host | **macOS** | Real BLE needs a **physical iPhone** (Simulator has no Bluetooth radio). Mac + Xcode is the normal signing path; Apple Developer account required for device install. |
| State | **Zustand** | Minimal boilerplate, fine-grained subscriptions, no provider tree. Right size for this app. |
| Navigation | **React Navigation (native-stack)** | Tab screens + full-screen modals (Connect / Live Ride / Summary). |
| Persistence | **AsyncStorage** (via a small typed repository) | Simple key-value is enough for history/settings/last-device; swappable later. |
| Data-flow architecture | **`BikeSource` interface → Zustand store** (Approach A) | Keeps the ride engine pure and testable; simulator and real FTMS are interchangeable implementations. |

**Iteration note:** JS/UI changes hot-reload on the device instantly. Native-dependency changes (BLE, permissions, config plugins) require a rebuild via Xcode/EAS. Nail the native footprint early; iterate on JS after.

---

## 3. Architecture

### 3.1 The core seam: `BikeSource`

A single interface abstracts *where live bike data comes from*. Two implementations:

- **`FtmsBikeSource`** — real `react-native-ble-plx`: scan, connect, subscribe to Indoor Bike Data, parse packets, optionally write the Control Point.
- **`SimulatedBikeSource`** — the prototype's physics model, for demo mode and automated tests (runs with no hardware).

```
interface BikeSource {
  scan(onDevice: (d: DiscoveredDevice) => void): Stop;   // start scanning; call Stop() to cancel
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  onData(cb: (s: BikeReading) => void): Unsubscribe;      // ~1 Hz stream
  setResistance?(level: number): Promise<void>;           // present only if bike supports control
  readonly capabilities: { control: boolean };
  readonly connection: 'idle' | 'scanning' | 'connecting' | 'connected' | 'error';
}

type BikeReading = {
  cadence: number;        // rpm (already /2 from FTMS units)
  speedKmh?: number;      // if broadcast; else derived by ride engine
  resistance?: number;    // if broadcast
  distanceKm?: number;    // if broadcast (cumulative)
  calories?: number;      // if broadcast (cumulative)
  power?: number;         // optional, if present
  ts: number;
};
```

The store never imports `ble-plx` directly — it only holds a `BikeSource`. Swapping to demo mode is a one-line source swap.

### 3.2 The ride engine (pure logic)

A framework-free module (`rideEngine.ts`) that takes the current session state + the latest reading + elapsed tick and returns the next session state. It owns:
- interval auto-advance by duration, finish-on-last-interval;
- pause (freeze time/distance/calorie accumulation);
- derivation of any metric the bike omits (distance from speed·time, calories from the documented model);
- rolling average-RPM accumulator;
- resistance target cue (▲n/▼n vs. the interval target).

Because it's pure, the same engine is exercised by unit tests using `SimulatedBikeSource` and drives the real ride identically. This is the single most important testability decision given slow on-device iteration.

**Derivation formulas (from the handoff, used when the bike omits a field or in demo mode):**
- `speedKmh = cadence × (0.26 + resistance × 0.004)`
- `kcal/s   = 0.16 × (cadence/85) × (max(resistance,4)/10)`
- `distanceKm += speedKmh / 3600` per second
- Simulated cadence easing: `cad += (target − cad)·0.3 + rand(±4)`, clamped `[50,115]`; free-ride target 85.

### 3.3 Layered module structure

```
src/
  ble/
    BikeSource.ts            # interface + shared types
    FtmsBikeSource.ts        # real ble-plx implementation
    SimulatedBikeSource.ts   # prototype physics; demo mode + tests
    ftmsParser.ts            # pure: Indoor Bike Data (0x2AD2) flags → BikeReading
    ftmsControl.ts           # pure builders for Control Point (0x2AD9) opcodes
    constants.ts             # UUIDs: 0x1826, 0x2AD2, 0x2AD9, 0x1816 (CSC fallback)
  engine/
    rideEngine.ts            # pure session reducer (tick/advance/pause/finish)
    programs.ts              # the 3 built-in programs (seed data)
    formulas.ts              # speed/calorie/distance derivations + unit conversion
    types.ts                 # Program, Segment, Session, Summary, Ride
  store/
    bikeStore.ts             # Zustand: connection + live session, wires BikeSource → engine
    settingsStore.ts         # units, weekly goal, last device id (persisted)
    historyStore.ts          # ride history (persisted)
  persistence/
    repository.ts            # typed AsyncStorage read/write; JSON (de)serialization
  screens/
    ConnectScreen.tsx  HomeScreen.tsx  LiveRideScreen.tsx  SummaryScreen.tsx
    RidesScreen.tsx  ProgramsScreen.tsx  ProfileScreen.tsx
  navigation/
    RootNavigator.tsx        # tabs (Home/Rides/Programs/Profile) + modals (Connect/Ride/Summary)
    TabBar.tsx               # custom tab bar matching the spec (2px top border, orange active)
  ui/
    tokens.ts                # colors, spacing, type scale from README
    text.ts                  # Barlow Condensed weight presets
    components/              # Block, MetricColumn, PrimaryButton, EyebrowLabel, etc.
  App.tsx
```

### 3.4 Data flow (one ride)

```
FtmsBikeSource (BLE notify ~1 Hz)
   → ftmsParser → BikeReading
   → bikeStore.ingest(reading)  ── on each 1 s tick ──▶ rideEngine.tick(session, reading)
   → new session state in store
   → LiveRideScreen re-renders (cadence hero, metrics, interval bar, phase banner)
On finish/END → engine builds Summary → SummaryScreen → DONE → historyStore.prepend(ride) + persist
```

---

## 4. Data models

```
type Segment = { label: string; dur: number; lo: number; hi: number; res: number };
type Program = { id: string; name: string; desc: string; segs: Segment[] };

type Session = {
  program: Program | null;
  elapsed: number; segIdx: number; segElapsed: number;
  paused: boolean;
  cadence: number; resistance: number; speedKmh: number; distanceKm: number; calories: number;
  rpmSum: number; rpmN: number;
};

type Summary = { name: string; sec: number; km: number; kcal: number; avgRpm: number; pb: boolean };
type Ride    = { id: string; name: string; when: string; min: number; km: number; kcal: number; date: string /*ISO*/ };

type Settings = { units: 'km' | 'mi'; weeklyGoalKm: number; lastDeviceId: string | null };
```

**Seed data** (ship-with, from the handoff — exact durations/rpm/resistance):
- **HIIT 30** "8 SPRINTS · HARD": WARM UP 300s @70–80 res8; 8×(PUSH—SPRINT 60s @90–100 res16, RECOVER 90s @70–80 res10); COOL DOWN 300s @60–70 res6.
- **ENDURANCE 45** "STEADY ZONE 2": WARM UP 180s @65–75 res8; STEADY—ZONE 2 2340s @75–85 res12; COOL DOWN 180s @60–70 res6.
- **PYRAMID 20** "CLIMB UP, SPIN DOWN": WARM UP 120s @70–80 res8; CLIMB 1 180s @80–90 res12; CLIMB 2 180s @85–95 res16; PEAK 120s @90–100 res20; DESCEND 180s @80–90 res14; SPIN OUT 180s @75–85 res10; COOL DOWN 120s @60–70 res6.

**Seed history** (3 rides, matching the prototype) is loaded only on first launch when persistence is empty.

---

## 5. BLE / FTMS layer

Real S3 integration against the standard **Fitness Machine Service**:

- **Service `0x1826`** (Fitness Machine). Subscribe to **Indoor Bike Data `0x2AD2`** — a flags-prefixed packet with instantaneous speed, **cadence in 0.5-rpm units (divide by 2)**, resistance level, and often cumulative distance/energy. `ftmsParser.ts` decodes the flag bitfield and extracts present fields into a `BikeReading`; omitted fields are left `undefined` for the engine to derive.
- **Resistance control (optional)** via **Fitness Machine Control Point `0x2AD9`**: `Request Control` → `Set Target Resistance`. Detect support at connect time; expose `capabilities.control`. If unsupported, the +/− control is **read-only** and only shows the ▲/▼ cue.
- **CSC fallback `0x1816`**: some Yesoul firmware exposes cadence only via CSC. Probe FTMS first; fall back to CSC (compute the rest via formulas).
- **Auto-reconnect:** persist the iOS peripheral UUID (`lastDeviceId`) and attempt a silent reconnect on launch; skip the Connect screen on success. (iOS identifies peripherals by an opaque system UUID, not a MAC.)

**iOS specifics to handle:** `NSBluetoothAlwaysUsageDescription` in the config plugin/Info.plist; runtime permission + powered-on state checks; graceful "bike asleep / out of range" states matching the Connect screen copy.

**Verification approach:** `ftmsParser.ts` is pure and unit-tested against captured/known FTMS byte packets — no device needed to prove parsing. Only end-to-end connect is device-dependent.

---

## 6. Screens & navigation

Seven screens, ported 1:1 from the prototype (see `design/README.md` §Screens for exact tokens/copy). Behavior is defined there and in the prototype's `Component` class.

- **Tabs:** Home · Rides · Programs · Profile (custom tab bar, 2px `#241f27` top border, orange active).
- **Modals (full-screen, outside tabs):** Connect, Live Ride, Summary.
- **Live Ride** runs a 1 Hz tick, auto-advances program intervals, finishes on the last interval or END, and freezes on pause. No tab bar during a ride.

Design tokens (colors, Barlow Condensed scale, 0 border-radius, 2px borders, 22px h-padding) are centralized in `ui/tokens.ts` and `ui/text.ts` — transcribed verbatim from the README so the port stays faithful.

---

## 7. Persistence

A thin `repository.ts` over AsyncStorage with three namespaced keys: `settings`, `history`, `lastDevice`. All writes go through typed setters; reads hydrate the Zustand stores on launch. History is newest-first; `DONE` prepends the completed ride and updates weekly/monthly aggregates (aggregates are derived on read, not stored). PB detection = ride distance > max distance in history.

---

## 8. Testing strategy

- **Unit (no device):** `ftmsParser` (byte packets → readings), `rideEngine` (interval advance, pause freeze, finish-on-last, calorie/distance accumulation, avg-RPM, PB detection), `formulas` (unit conversion km↔mi), `programs` (seed integrity).
- **Component:** key screens render correct values from a given store state (React Native Testing Library).
- **Manual on-device checklist:** scan/connect to the real S3, live cadence tracks pedaling, resistance cue correctness, reconnect-on-launch, a full program ride end-to-end, summary → history persistence across app restart.
- **Demo mode** (SimulatedBikeSource) is the standing fallback to exercise the full app on a device without the bike.

---

## 9. Risks & open questions

| Risk | Mitigation |
|---|---|
| S3 firmware variant (FTMS vs CSC-only; control unsupported) | Probe + fallback + `capabilities.control`; read-only resistance path already designed. |
| Unknown exact FTMS flag layout for this S3 | Pure parser + on-device packet capture early in Phase 1; adjust parser from real bytes. |
| Slow native rebuild loop on device | Pure engine/parser tested off-device; demo mode; freeze native footprint early. |
| Apple Developer account / signing (Mac side) | Called out as an explicit setup task; normal Xcode flow. |
| iOS peripheral UUID can change in edge cases | Auto-reconnect falls back to the Connect scan gracefully. |

**Open questions for the rider/Mac dev:**
1. Does this specific S3 unit support FTMS Control Point resistance writes, or read-only? (Confirm on-device in Phase 1.)
2. Apple Developer account available on the Mac for device installs?
3. Keep demo mode shipped (hidden dev toggle) or strip it from release builds?
