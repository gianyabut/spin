# Yesoul PULSE App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an iOS React Native companion app for the Yesoul S3 spin bike that pairs over Bluetooth FTMS, drives a live ride dashboard from real bike data, runs structured interval programs, and persists ride history — faithfully matching the finalized prototype in `design/`.

**Architecture:** A pure, testable core (FTMS packet parser + ride engine) sits behind a `BikeSource` interface with two implementations — real `react-native-ble-plx` (`FtmsBikeSource`) and a simulator (`SimulatedBikeSource`) for demo mode and tests. Zustand stores wire the source through the engine to seven screens. All hardware and UI transcription is downstream of the pure core, so most logic is proven off-device.

**Tech Stack:** Expo (dev client) · React Native · TypeScript · `react-native-ble-plx` · Zustand · React Navigation (native-stack) · AsyncStorage · Jest + `jest-expo` + React Native Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-29-yesoul-pulse-app-design.md` (read it alongside this plan — the plan implements that spec). The finalized UI lives in `design/Yesoul PULSE App.dc.html` and `design/README.md`; those are the pixel-perfect source of truth for every screen.

## Global Constraints

- **Platform:** iOS only. Developed and built on **macOS** (Xcode/Expo). Real BLE requires a **physical iPhone** — the iOS Simulator has no Bluetooth radio.
- **BLE:** Uses `react-native-ble-plx` (a native module) → **cannot run in Expo Go**; requires an Expo **dev client** build. Never `import` `ble-plx` outside `src/ble/`.
- **FTMS facts (verbatim):** Fitness Machine Service `0x1826`; Indoor Bike Data `0x2AD2`; Fitness Machine Control Point `0x2AD9`; CSC fallback service `0x1816`. **FTMS cadence field is in 0.5-rpm units — divide by 2.**
- **Design tokens (verbatim, from `design/README.md`):** bg `#121014`; surface/border `#332E36`; hairline rule `#241f27`; text `#F4F1EC`; muted `#9B959D`; accent `#FF5C1F`; accent hover `#ff6e38`; on-accent `#121014`. Font **Barlow Condensed** weights 500/600/700/800. **Border-radius 0 everywhere except circles.** 2px solid borders; active borders switch to accent. Screen h-padding 22px. All labels/copy UPPERCASE as shown in the prototype.
- **Derivation formulas (verbatim):** `speedKmh = cadence × (0.26 + resistance × 0.004)`; `kcal/s = 0.16 × (cadence/85) × (max(resistance,4)/10)`; `distanceKm += speedKmh/3600` per 1 s tick. Simulated cadence: `cad += (target − cad)·0.3 + rand(±4)`, clamp `[50,115]`, free-ride target 85.
- **Resistance:** integer, clamped **1–32** (S3 range), step 1.
- **Units:** `km` default; `mi` conversion factor **0.621** applied to speed and distance; labels KM/H↔MPH, KM↔MI.
- **TDD:** every logic task writes the failing test first. **Commit after every task.** DRY, YAGNI.

---

## File Structure

```
app.json / app.config.ts   Expo config: name, iOS bundle id, ble-plx plugin, NSBluetoothAlwaysUsageDescription
package.json               deps + scripts (test, lint, ios)
babel.config.js            expo preset
jest.config.js             jest-expo preset + setup
tsconfig.json              strict TS

src/
  ble/
    constants.ts           FTMS/CSC UUIDs, Control Point opcodes
    ftmsParser.ts          PURE: Indoor Bike Data flags → BikeReading
    ftmsControl.ts         PURE: Control Point opcode byte builders
    BikeSource.ts          interface + shared types (BikeReading, DiscoveredDevice, ConnState)
    SimulatedBikeSource.ts prototype physics; demo mode + tests
    FtmsBikeSource.ts      real ble-plx implementation
  engine/
    types.ts               Segment, Program, Session, Summary, Ride, Settings
    formulas.ts            PURE: speed/kcal/distance derivations + unit conversion
    programs.ts            the 3 built-in programs (seed) + seed history
    rideEngine.ts          PURE: session reducer (start/tick/advance/pause/finish)
  persistence/
    repository.ts          typed AsyncStorage read/write
  store/
    bikeStore.ts           Zustand: connection + live session; wires BikeSource→engine
    settingsStore.ts       units, weekly goal, lastDeviceId (persisted)
    historyStore.ts        ride history (persisted)
  ui/
    tokens.ts              colors, spacing, type scale
    text.ts                <T> text component with Barlow weight presets
    components/            Block, PrimaryButton, MetricColumn, EyebrowLabel, ScreenFrame, Bars
  screens/                 Connect, Home, LiveRide, Summary, Rides, Programs, Profile
  navigation/
    RootNavigator.tsx      tabs + modals
    TabBar.tsx             custom tab bar
  App.tsx                  hydrate stores, mount navigator, attempt auto-reconnect

__tests__/                 mirrors src/ for pure-logic tests
```

---

## Phase 0 — Project scaffold

### Task 0.1: Initialize Expo + TypeScript project with dev-client and tooling

**Files:**
- Create: `package.json`, `app.json`, `babel.config.js`, `tsconfig.json`, `jest.config.js`, `jest.setup.js`, `App.tsx`, `src/ui/tokens.ts`

**Interfaces:**
- Produces: `tokens` object (colors + spacing + type scale) consumed by every UI task.

- [ ] **Step 1: Scaffold the app (run on the Mac)**

```bash
npx create-expo-app@latest pulse --template blank-typescript
cd pulse
npx expo install expo-dev-client react-native-ble-plx @react-native-async-storage/async-storage
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
npm i zustand
npm i -D jest jest-expo @testing-library/react-native @testing-library/jest-native @types/jest
```

> Note: the repo root already contains `docs/` and `design/`. Create the Expo app in a `pulse/` subfolder (or move its files to root) so `design/` stays as reference. Keep one lockfile at the app root.

- [ ] **Step 2: Configure Jest**

`jest.config.js`:
```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', '<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|react-native-ble-plx|zustand))',
  ],
};
```

`jest.setup.js`:
```js
// Silence native module warnings in unit tests; BLE is never imported in pure tests.
jest.mock('react-native-ble-plx', () => ({ BleManager: jest.fn() }), { virtual: true });
```

Add scripts to `package.json`:
```json
"scripts": { "start": "expo start --dev-client", "ios": "expo run:ios", "test": "jest", "tsc": "tsc --noEmit" }
```

- [ ] **Step 3: Configure the iOS Bluetooth permission and bundle id**

`app.json` → under `expo`:
```json
"ios": { "bundleIdentifier": "com.pulse.spin", "supportsTablet": false,
  "infoPlist": { "NSBluetoothAlwaysUsageDescription": "PULSE connects to your Yesoul S3 bike over Bluetooth to show live ride metrics." } },
"plugins": ["expo-dev-client", "react-native-ble-plx"]
```

- [ ] **Step 4: Write design tokens**

`src/ui/tokens.ts`:
```ts
export const colors = {
  bg: '#121014', surface: '#332E36', rule: '#241f27',
  text: '#F4F1EC', muted: '#9B959D',
  accent: '#FF5C1F', accentHover: '#ff6e38', onAccent: '#121014',
} as const;
export const space = { screenX: 22, cardGap: 12, segGap: 4 } as const;
export const type = {
  hero: 200, title: 34, titleXL: 58, cta: 42, metric: 36, cardTitle: 22,
  label: 13, body: 15,
} as const;
export const BORDER = 2; // px, solid colors.surface unless active
```

- [ ] **Step 5: Smoke test the toolchain**

`__tests__/tokens.test.ts`:
```ts
import { colors } from '../src/ui/tokens';
test('accent token is the PULSE orange', () => { expect(colors.accent).toBe('#FF5C1F'); });
```
Run: `npm test` → Expected: PASS. Run: `npm run tsc` → Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold Expo iOS app, jest, and design tokens"
```

---

## Phase 1 — FTMS core (pure, off-device)

### Task 1.1: BLE constants and shared types

**Files:**
- Create: `src/ble/constants.ts`, `src/ble/BikeSource.ts`

**Interfaces:**
- Produces: `FTMS`, `CSC`, `CP_OPCODE` constant maps; `BikeReading`, `DiscoveredDevice`, `ConnState`, `BikeSource` types consumed by the parser, both sources, and the store.

- [ ] **Step 1: Write the constants**

`src/ble/constants.ts`:
```ts
export const FTMS = {
  service: '00001826-0000-1000-8000-00805f9b34fb',
  indoorBikeData: '00002ad2-0000-1000-8000-00805f9b34fb',
  controlPoint: '00002ad9-0000-1000-8000-00805f9b34fb',
} as const;
export const CSC = {
  service: '00001816-0000-1000-8000-00805f9b34fb',
  measurement: '00002a5b-0000-1000-8000-00805f9b34fb',
} as const;
export const CP_OPCODE = { requestControl: 0x00, setTargetResistance: 0x04 } as const;
```

- [ ] **Step 2: Write the shared types**

`src/ble/BikeSource.ts`:
```ts
export type BikeReading = {
  cadence: number;         // rpm (already /2 from FTMS units)
  speedKmh?: number;
  resistance?: number;
  distanceKm?: number;     // cumulative if broadcast
  calories?: number;       // cumulative if broadcast
  power?: number;
  ts: number;
};
export type DiscoveredDevice = { id: string; name: string; rssi: number | null };
export type ConnState = 'idle' | 'scanning' | 'connecting' | 'connected' | 'error';
export type Unsubscribe = () => void;

export interface BikeSource {
  readonly capabilities: { control: boolean };
  getState(): ConnState;
  scan(onDevice: (d: DiscoveredDevice) => void): Unsubscribe;
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  onData(cb: (r: BikeReading) => void): Unsubscribe;
  onState(cb: (s: ConnState) => void): Unsubscribe;
  setResistance?(level: number): Promise<void>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/ble/constants.ts src/ble/BikeSource.ts
git commit -m "feat(ble): FTMS/CSC constants and BikeSource interface"
```

### Task 1.2: FTMS Indoor Bike Data parser (pure, fully tested)

The Indoor Bike Data characteristic is a little-endian packet: 16-bit flags, then present fields in a fixed order. Fields we consume, in order after the flags: Instantaneous Speed (uint16, 0.01 km/h, present when flag bit 0 is **0**), Instantaneous Cadence (uint16, **0.5 rpm units**, flag bit 2), Total Distance (uint24, meters, flag bit 4), Resistance Level (sint16, flag bit 5), Total Energy (uint16 kcal, flag bit 8). (Average-speed/inst.power etc. are skipped for v1; parser must still advance offsets correctly for the fields it reads.)

**Files:**
- Create: `src/ble/ftmsParser.ts`, `__tests__/ftmsParser.test.ts`

**Interfaces:**
- Consumes: `BikeReading` from `src/ble/BikeSource.ts`.
- Produces: `parseIndoorBikeData(bytes: number[] | Uint8Array): BikeReading`.

- [ ] **Step 1: Write failing tests**

`__tests__/ftmsParser.test.ts`:
```ts
import { parseIndoorBikeData } from '../src/ble/ftmsParser';

// flags=0x0004 → bit0=0 (speed present), bit2=1 (cadence present). LE.
// speed=2500 (0x09C4) = 25.00 km/h ; cadence=180 (0x00B4) = 90.0 rpm (÷2)
test('parses speed and cadence', () => {
  const bytes = [0x04, 0x00, 0xC4, 0x09, 0xB4, 0x00];
  const r = parseIndoorBikeData(bytes);
  expect(r.speedKmh).toBeCloseTo(25.0, 3);
  expect(r.cadence).toBeCloseTo(90.0, 3);
});

test('divides FTMS cadence by 2', () => {
  const bytes = [0x04, 0x00, 0xC4, 0x09, 0x64, 0x00]; // cadence raw 100 → 50 rpm
  expect(parseIndoorBikeData(bytes).cadence).toBe(50);
});

// flags bit0=1 → speed field ABSENT. bit2 cadence, bit5 resistance.
// flags=0x0025 → bits 0,2,5. cadence raw 170=85rpm, resistance sint16=16
test('skips absent speed and reads resistance', () => {
  const bytes = [0x25, 0x00, 0xAA, 0x00, 0x10, 0x00];
  const r = parseIndoorBikeData(bytes);
  expect(r.speedKmh).toBeUndefined();
  expect(r.cadence).toBe(85);
  expect(r.resistance).toBe(16);
});

test('missing cadence yields cadence 0', () => {
  const bytes = [0x00, 0x00, 0xC4, 0x09]; // only speed present
  expect(parseIndoorBikeData(bytes).cadence).toBe(0);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- ftmsParser` → Expected: FAIL ("parseIndoorBikeData is not a function").

- [ ] **Step 3: Implement the parser**

`src/ble/ftmsParser.ts`:
```ts
import type { BikeReading } from './BikeSource';

export function parseIndoorBikeData(input: number[] | Uint8Array): BikeReading {
  const b = Array.from(input);
  const u16 = (o: number) => b[o] | (b[o + 1] << 8);
  const s16 = (o: number) => { const v = u16(o); return v & 0x8000 ? v - 0x10000 : v; };
  const u24 = (o: number) => b[o] | (b[o + 1] << 8) | (b[o + 2] << 16);

  const flags = u16(0);
  let o = 2;
  const r: BikeReading = { cadence: 0, ts: Date.now() };

  // bit0 == 0 → Instantaneous Speed present (uint16, 0.01 km/h)
  if ((flags & (1 << 0)) === 0) { r.speedKmh = u16(o) / 100; o += 2; }
  // bit1 average speed — skip if present
  if (flags & (1 << 1)) { o += 2; }
  // bit2 Instantaneous Cadence (uint16, 0.5 rpm units)
  if (flags & (1 << 2)) { r.cadence = u16(o) / 2; o += 2; }
  // bit3 average cadence — skip
  if (flags & (1 << 3)) { o += 2; }
  // bit4 Total Distance (uint24, meters)
  if (flags & (1 << 4)) { r.distanceKm = u24(o) / 1000; o += 3; }
  // bit5 Resistance Level (sint16)
  if (flags & (1 << 5)) { r.resistance = s16(o); o += 2; }
  // bit6 instantaneous power (sint16) — skip
  if (flags & (1 << 6)) { o += 2; }
  // bit7 average power — skip
  if (flags & (1 << 7)) { o += 2; }
  // bit8 Total Energy group (total kcal uint16, per-hour uint16, per-min uint8)
  if (flags & (1 << 8)) { r.calories = u16(o); o += 5; }

  return r;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test -- ftmsParser` → Expected: PASS (all 4).

- [ ] **Step 5: Commit**

```bash
git add src/ble/ftmsParser.ts __tests__/ftmsParser.test.ts
git commit -m "feat(ble): tested FTMS Indoor Bike Data parser"
```

### Task 1.3: Control Point opcode builders (pure)

**Files:**
- Create: `src/ble/ftmsControl.ts`, `__tests__/ftmsControl.test.ts`

**Interfaces:**
- Consumes: `CP_OPCODE` from `constants.ts`.
- Produces: `requestControl(): number[]`, `setTargetResistance(level: number): number[]` (returns bytes; caller base64-encodes for ble-plx).

- [ ] **Step 1: Write failing tests**

`__tests__/ftmsControl.test.ts`:
```ts
import { requestControl, setTargetResistance } from '../src/ble/ftmsControl';
test('requestControl is opcode 0x00', () => { expect(requestControl()).toEqual([0x00]); });
test('setTargetResistance packs opcode + level byte', () => {
  expect(setTargetResistance(16)).toEqual([0x04, 16]);
});
test('setTargetResistance clamps to 1..32', () => {
  expect(setTargetResistance(99)).toEqual([0x04, 32]);
  expect(setTargetResistance(0)).toEqual([0x04, 1]);
});
```

- [ ] **Step 2: Run → FAIL.** `npm test -- ftmsControl`

- [ ] **Step 3: Implement**

`src/ble/ftmsControl.ts`:
```ts
import { CP_OPCODE } from './constants';
export const requestControl = (): number[] => [CP_OPCODE.requestControl];
export const setTargetResistance = (level: number): number[] =>
  [CP_OPCODE.setTargetResistance, Math.max(1, Math.min(32, Math.round(level)))];
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** `git commit -am "feat(ble): FTMS Control Point opcode builders"`

---

## Phase 2 — Real connection (on-device)

### Task 2.1: SimulatedBikeSource (demo mode + reference implementation)

Build the simulator first: it implements `BikeSource` exactly, needs no hardware, and lets Connect/Live Ride be developed and tested before the real driver is proven.

**Files:**
- Create: `src/ble/SimulatedBikeSource.ts`, `__tests__/simulatedSource.test.ts`

**Interfaces:**
- Consumes: `BikeSource`, `BikeReading`, `ConnState`, `DiscoveredDevice`.
- Produces: `class SimulatedBikeSource implements BikeSource` with `setTarget(rpm: number)` and `setResistance(level)` used by the store to feed the physics.

- [ ] **Step 1: Write failing tests**

`__tests__/simulatedSource.test.ts`:
```ts
import { SimulatedBikeSource } from '../src/ble/SimulatedBikeSource';

test('scan reports a simulated device then connect flips state to connected', async () => {
  const s = new SimulatedBikeSource();
  const found: string[] = [];
  s.scan(d => found.push(d.name));
  await new Promise(r => setTimeout(r, 20));
  expect(found[0]).toMatch(/YESOUL/i);
  await s.connect('sim');
  expect(s.getState()).toBe('connected');
});

test('emits readings that ease toward the set target', async () => {
  const s = new SimulatedBikeSource();
  await s.connect('sim');
  s.setTarget(90);
  const readings: number[] = [];
  s.onData(r => readings.push(r.cadence));
  await new Promise(r => setTimeout(r, 120)); // a few ticks (tick=30ms in test mode)
  expect(readings.length).toBeGreaterThan(1);
  expect(readings[readings.length - 1]).toBeGreaterThan(readings[0]);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`src/ble/SimulatedBikeSource.ts`:
```ts
import type { BikeSource, BikeReading, ConnState, DiscoveredDevice, Unsubscribe } from './BikeSource';

export class SimulatedBikeSource implements BikeSource {
  readonly capabilities = { control: true };
  private state: ConnState = 'idle';
  private cad = 62; private target = 85; private res = 8;
  private dataCbs = new Set<(r: BikeReading) => void>();
  private stateCbs = new Set<(s: ConnState) => void>();
  private timer: any = null;
  private tickMs = process.env.NODE_ENV === 'test' ? 30 : 1000;

  getState() { return this.state; }
  private set(s: ConnState) { this.state = s; this.stateCbs.forEach(cb => cb(s)); }

  scan(onDevice: (d: DiscoveredDevice) => void): Unsubscribe {
    this.set('scanning');
    const t = setTimeout(() => onDevice({ id: 'sim', name: 'YESOUL S3-4F2A', rssi: -55 }), 10);
    return () => clearTimeout(t);
  }
  async connect(_id: string) {
    this.set('connecting'); this.set('connected');
    this.timer = setInterval(() => this.step(), this.tickMs);
  }
  async disconnect() { if (this.timer) clearInterval(this.timer); this.timer = null; this.set('idle'); }
  onData(cb: (r: BikeReading) => void) { this.dataCbs.add(cb); return () => this.dataCbs.delete(cb); }
  onState(cb: (s: ConnState) => void) { this.stateCbs.add(cb); return () => this.stateCbs.delete(cb); }
  async setResistance(level: number) { this.res = Math.max(1, Math.min(32, level)); }
  setTarget(rpm: number) { this.target = rpm; }

  private step() {
    this.cad += (this.target - this.cad) * 0.3 + (Math.random() * 8 - 4);
    this.cad = Math.max(50, Math.min(115, this.cad));
    this.dataCbs.forEach(cb => cb({ cadence: this.cad, resistance: this.res, ts: Date.now() }));
  }
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** `git commit -am "feat(ble): SimulatedBikeSource for demo mode and tests"`

### Task 2.2: FtmsBikeSource — real ble-plx scan/connect/subscribe

Device-dependent; verify on the physical iPhone. Parsing is already proven (Task 1.2), so this task is BLE plumbing only.

**Files:**
- Create: `src/ble/FtmsBikeSource.ts`

**Interfaces:**
- Consumes: `BleManager` from `react-native-ble-plx`; `FTMS`, `CSC` constants; `parseIndoorBikeData`; `requestControl`, `setTargetResistance`; `BikeSource` types.
- Produces: `class FtmsBikeSource implements BikeSource`.

- [ ] **Step 1: Implement the driver**

`src/ble/FtmsBikeSource.ts`:
```ts
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import type { BikeSource, BikeReading, ConnState, DiscoveredDevice, Unsubscribe } from './BikeSource';
import { FTMS } from './constants';
import { parseIndoorBikeData } from './ftmsParser';
import { requestControl, setTargetResistance } from './ftmsControl';

const b64ToBytes = (b64: string) => Array.from(Buffer.from(b64, 'base64'));
const bytesToB64 = (bytes: number[]) => Buffer.from(bytes).toString('base64');

export class FtmsBikeSource implements BikeSource {
  capabilities = { control: false };
  private mgr = new BleManager();
  private device: Device | null = null;
  private state: ConnState = 'idle';
  private dataCbs = new Set<(r: BikeReading) => void>();
  private stateCbs = new Set<(s: ConnState) => void>();
  private notifySub: Subscription | null = null;

  getState() { return this.state; }
  private set(s: ConnState) { this.state = s; this.stateCbs.forEach(cb => cb(s)); }
  onData(cb: (r: BikeReading) => void) { this.dataCbs.add(cb); return () => this.dataCbs.delete(cb); }
  onState(cb: (s: ConnState) => void) { this.stateCbs.add(cb); return () => this.stateCbs.delete(cb); }

  scan(onDevice: (d: DiscoveredDevice) => void): Unsubscribe {
    this.set('scanning');
    this.mgr.startDeviceScan([FTMS.service], null, (err, dev) => {
      if (err || !dev) return;
      onDevice({ id: dev.id, name: dev.name ?? dev.localName ?? 'SMART BIKE', rssi: dev.rssi });
    });
    return () => this.mgr.stopDeviceScan();
  }

  async connect(deviceId: string) {
    this.set('connecting');
    try {
      this.mgr.stopDeviceScan();
      const dev = await this.mgr.connectToDevice(deviceId);
      await dev.discoverAllServicesAndCharacteristics();
      this.device = dev;
      // Try to enable control (optional; failure is non-fatal).
      try {
        await dev.writeCharacteristicWithResponseForService(
          FTMS.service, FTMS.controlPoint, bytesToB64(requestControl()));
        this.capabilities = { control: true };
      } catch { this.capabilities = { control: false }; }
      this.notifySub = dev.monitorCharacteristicForService(
        FTMS.service, FTMS.indoorBikeData, (err, ch) => {
          if (err || !ch?.value) return;
          this.dataCbs.forEach(cb => cb(parseIndoorBikeData(b64ToBytes(ch.value!))));
        });
      dev.onDisconnected(() => this.set('idle'));
      this.set('connected');
    } catch { this.set('error'); throw new Error('connect failed'); }
  }

  async disconnect() {
    this.notifySub?.remove(); this.notifySub = null;
    if (this.device) await this.mgr.cancelDeviceConnection(this.device.id).catch(() => {});
    this.device = null; this.set('idle');
  }

  async setResistance(level: number) {
    if (!this.device || !this.capabilities.control) return;
    await this.device.writeCharacteristicWithResponseForService(
      FTMS.service, FTMS.controlPoint, bytesToB64(setTargetResistance(level)));
  }
}
```

- [ ] **Step 2: Type-check** — Run: `npm run tsc` → Expected: no errors. (No unit test: this is device I/O; the parser it delegates to is already tested. On-device verification is in Task 2.4.)

- [ ] **Step 3: Commit** `git commit -am "feat(ble): real FtmsBikeSource (scan/connect/notify/control)"`

### Task 2.3: Connect screen wired to a source

**Files:**
- Create: `src/screens/ConnectScreen.tsx`, `src/ui/text.ts`, `src/ui/components/ScreenFrame.tsx`
- Test: `__tests__/connectScreen.test.tsx`

**Interfaces:**
- Consumes: a `BikeSource` (injected prop for testability), `tokens`.
- Produces: `<ConnectScreen source={...} onConnected={() => void} />`.

Port markup verbatim from `design/Yesoul PULSE App.dc.html` lines 18–42 (title "CONNECT YOUR BIKE" 44/800; scanning subline with blinking orange `_`; 140/96/54px concentric scan rings, inner solid-orange "SCAN" disc; on-found "1 DEVICE FOUND" eyebrow + orange-bordered device row "YESOUL S3-4F2A" / "SMART BIKE · FTMS" + 4 signal bars; bottom full-width orange CONNECT button; while scanning show "MAKE SURE THE BIKE CONSOLE IS AWAKE" in `#332E36`).

- [ ] **Step 1: Write failing test**

`__tests__/connectScreen.test.tsx`:
```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ConnectScreen } from '../src/screens/ConnectScreen';
import { SimulatedBikeSource } from '../src/ble/SimulatedBikeSource';

test('shows discovered device then connects', async () => {
  const src = new SimulatedBikeSource();
  const onConnected = jest.fn();
  const { getByText } = render(<ConnectScreen source={src} onConnected={onConnected} />);
  await waitFor(() => getByText('YESOUL S3-4F2A'));
  fireEvent.press(getByText('CONNECT'));
  await waitFor(() => expect(onConnected).toHaveBeenCalled());
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `src/ui/text.ts`** (shared text primitive)

```tsx
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors } from './tokens';
const F = 'BarlowCondensed'; // registered via expo-font in App.tsx (Task 6.x); falls back to system in tests
export function T({ style, ...p }: TextProps) {
  return <Text {...p} style={[{ fontFamily: F, color: colors.text }, style]} />;
}
export const styles = StyleSheet.create({}); // reserved
```

- [ ] **Step 4: Implement `ScreenFrame` and `ConnectScreen`** (dark frame + safe area; transcribe the prototype block). Wire: on mount call `source.scan(...)`; on device found `setState(device)`; CONNECT calls `await source.connect(device.id)` then `onConnected()`.

```tsx
// src/screens/ConnectScreen.tsx (structure — port exact styles from the prototype block)
import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import type { BikeSource, DiscoveredDevice } from '../ble/BikeSource';
import { colors } from '../ui/tokens';
import { T } from '../ui/text';

export function ConnectScreen({ source, onConnected }: { source: BikeSource; onConnected: () => void }) {
  const [device, setDevice] = useState<DiscoveredDevice | null>(null);
  useEffect(() => { const stop = source.scan(setDevice); return stop; }, [source]);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 22, paddingTop: 68 }}>
      <T style={{ fontSize: 44, fontWeight: '800', lineHeight: 46 }}>CONNECT{'\n'}YOUR BIKE</T>
      <T style={{ fontSize: 15, fontWeight: '600', letterSpacing: 1.8, color: colors.muted, marginTop: 8 }}>
        SCANNING FOR BLUETOOTH FTMS<T style={{ color: colors.accent }}>_</T>
      </T>
      {/* concentric scan rings — 3 circles per prototype lines 22–28 */}
      {device && (
        <>
          <T style={{ fontSize: 13, letterSpacing: 2.6, color: colors.muted, marginBottom: 10 }}>1 DEVICE FOUND</T>
          <View style={{ borderWidth: 2, borderColor: colors.accent, padding: 16 }}>
            <T style={{ fontSize: 20, fontWeight: '700' }}>{device.name}</T>
            <T style={{ fontSize: 13, letterSpacing: 1.3, color: colors.muted, marginTop: 2 }}>SMART BIKE · FTMS</T>
          </View>
          <View style={{ flex: 1 }} />
          <Pressable onPress={async () => { await source.connect(device.id); onConnected(); }}
            style={{ backgroundColor: colors.accent, paddingVertical: 16 }}>
            <T style={{ textAlign: 'center', color: colors.onAccent, fontSize: 18, fontWeight: '800', letterSpacing: 2.7 }}>CONNECT</T>
          </Pressable>
        </>
      )}
      {!device && (
        <T style={{ fontSize: 13, letterSpacing: 2.6, color: colors.surface, textAlign: 'center', marginTop: 'auto' }}>
          MAKE SURE THE BIKE CONSOLE IS AWAKE</T>
      )}
    </View>
  );
}
```
(Fill the scan-ring circles + signal bars to match the prototype exactly — they're static styled `View`s.)

- [ ] **Step 5: Run → PASS.** `npm test -- connectScreen`

- [ ] **Step 6: Commit** `git commit -am "feat(screen): Connect screen wired to BikeSource"`

### Task 2.4: On-device connection verification (manual)

**Files:** none (manual checklist; record results in the PR/commit message).

- [ ] **Step 1:** On the Mac: `npx expo run:ios --device` to build the dev client onto the physical iPhone (requires Apple Developer signing in Xcode).
- [ ] **Step 2:** Temporarily mount `ConnectScreen` with `new FtmsBikeSource()` in `App.tsx`. Wake the S3 console.
- [ ] **Step 3:** Confirm: the device row appears with the real bike name; CONNECT succeeds; add a temporary `console.log` in `onData` and confirm cadence values change as you pedal, and that they are **realistic rpm (≈60–100), not doubled** (validates the ÷2). If cadence is absent, note whether the bike only advertises CSC `0x1816` (→ backlog a CSC fallback source).
- [ ] **Step 4:** Confirm whether `capabilities.control` came back `true` (resistance writes supported). Record the answer — it decides read-only vs. controllable resistance UI.
- [ ] **Step 5: Commit** the notes: `git commit --allow-empty -m "test(ble): on-device S3 connection verified (cadence ÷2 ok; control=<yes/no>)"`

---

## Phase 3 — Ride engine (pure, off-device)

### Task 3.1: Engine types, formulas, and unit conversion

**Files:**
- Create: `src/engine/types.ts`, `src/engine/formulas.ts`, `__tests__/formulas.test.ts`

**Interfaces:**
- Produces: types `Segment, Program, Session, Summary, Ride, Settings, Units`; `deriveSpeedKmh`, `deriveKcalPerSec`, `convDist`, `convSpeed`, `distLabel`, `speedLabel`.

- [ ] **Step 1: Write failing tests**

`__tests__/formulas.test.ts`:
```ts
import { deriveSpeedKmh, deriveKcalPerSec, convDist, distLabel, speedLabel } from '../src/engine/formulas';
test('speed from cadence and resistance', () => {
  expect(deriveSpeedKmh(90, 16)).toBeCloseTo(90 * (0.26 + 16 * 0.004), 5); // 29.16
});
test('kcal per second uses max(res,4)', () => {
  expect(deriveKcalPerSec(85, 2)).toBeCloseTo(0.16 * 1 * (4 / 10), 5); // res floored to 4
});
test('mi conversion and labels', () => {
  expect(convDist(10, 'mi')).toBeCloseTo(6.21, 2);
  expect(convDist(10, 'km')).toBe(10);
  expect(distLabel('mi')).toBe('MI'); expect(speedLabel('mi')).toBe('MPH');
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`src/engine/types.ts`:
```ts
export type Units = 'km' | 'mi';
export type Segment = { label: string; dur: number; lo: number; hi: number; res: number };
export type Program = { id: string; name: string; desc: string; segs: Segment[] };
export type Session = {
  program: Program | null; elapsed: number; segIdx: number; segElapsed: number; paused: boolean;
  cadence: number; resistance: number; speedKmh: number; distanceKm: number; calories: number;
  rpmSum: number; rpmN: number;
};
export type Summary = { name: string; sec: number; km: number; kcal: number; avgRpm: number; pb: boolean };
export type Ride = { id: string; name: string; when: string; min: number; km: number; kcal: number; date: string };
export type Settings = { units: Units; weeklyGoalKm: number; lastDeviceId: string | null };
```

`src/engine/formulas.ts`:
```ts
import type { Units } from './types';
export const deriveSpeedKmh = (cad: number, res: number) => cad * (0.26 + res * 0.004);
export const deriveKcalPerSec = (cad: number, res: number) => 0.16 * (cad / 85) * (Math.max(res, 4) / 10);
export const convDist = (km: number, u: Units) => (u === 'mi' ? km * 0.621 : km);
export const convSpeed = (kmh: number, u: Units) => (u === 'mi' ? kmh * 0.621 : kmh);
export const distLabel = (u: Units) => (u === 'mi' ? 'MI' : 'KM');
export const speedLabel = (u: Units) => (u === 'mi' ? 'MPH' : 'KM/H');
```

- [ ] **Step 4: Run → PASS.** — [ ] **Step 5: Commit** `git commit -am "feat(engine): types + formulas + unit conversion"`

### Task 3.2: Built-in programs + seed history

**Files:**
- Create: `src/engine/programs.ts`, `__tests__/programs.test.ts`

**Interfaces:**
- Produces: `PROGRAMS: Program[]` (3), `SEED_HISTORY: Ride[]` (3), `totalDur(p): number`.

- [ ] **Step 1: Write failing tests**

`__tests__/programs.test.ts`:
```ts
import { PROGRAMS, totalDur } from '../src/engine/programs';
test('ships exactly 3 programs', () => { expect(PROGRAMS.map(p => p.name)).toEqual(['HIIT 30','ENDURANCE 45','PYRAMID 20']); });
test('HIIT 30 has warmup + 8×(sprint,recover) + cooldown = 18 segments', () => {
  const hiit = PROGRAMS[0]; expect(hiit.segs.length).toBe(18);
  expect(hiit.segs[1]).toEqual({ label: 'PUSH — SPRINT', dur: 60, lo: 90, hi: 100, res: 16 });
});
test('HIIT 30 total is 30 minutes', () => { expect(totalDur(PROGRAMS[0])).toBe(30 * 60); });
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** (durations/rpm/res exactly per Global Constraints seed data)

`src/engine/programs.ts`:
```ts
import type { Program, Ride, Segment } from './types';
const hiit: Segment[] = [{ label: 'WARM UP', dur: 300, lo: 70, hi: 80, res: 8 }];
for (let i = 0; i < 8; i++) {
  hiit.push({ label: 'PUSH — SPRINT', dur: 60, lo: 90, hi: 100, res: 16 });
  hiit.push({ label: 'RECOVER', dur: 90, lo: 70, hi: 80, res: 10 });
}
hiit.push({ label: 'COOL DOWN', dur: 300, lo: 60, hi: 70, res: 6 });

export const PROGRAMS: Program[] = [
  { id: 'hiit30', name: 'HIIT 30', desc: '8 SPRINTS · HARD', segs: hiit },
  { id: 'end45', name: 'ENDURANCE 45', desc: 'STEADY ZONE 2', segs: [
    { label: 'WARM UP', dur: 180, lo: 65, hi: 75, res: 8 },
    { label: 'STEADY — ZONE 2', dur: 2340, lo: 75, hi: 85, res: 12 },
    { label: 'COOL DOWN', dur: 180, lo: 60, hi: 70, res: 6 } ] },
  { id: 'pyr20', name: 'PYRAMID 20', desc: 'CLIMB UP, SPIN DOWN', segs: [
    { label: 'WARM UP', dur: 120, lo: 70, hi: 80, res: 8 },
    { label: 'CLIMB 1', dur: 180, lo: 80, hi: 90, res: 12 },
    { label: 'CLIMB 2', dur: 180, lo: 85, hi: 95, res: 16 },
    { label: 'PEAK', dur: 120, lo: 90, hi: 100, res: 20 },
    { label: 'DESCEND', dur: 180, lo: 80, hi: 90, res: 14 },
    { label: 'SPIN OUT', dur: 180, lo: 75, hi: 85, res: 10 },
    { label: 'COOL DOWN', dur: 120, lo: 60, hi: 70, res: 6 } ] },
];
export const totalDur = (p: Program) => p.segs.reduce((a, g) => a + g.dur, 0);
export const SEED_HISTORY: Ride[] = [
  { id: 's1', name: 'HIIT 30', when: 'THU', min: 30, km: 11.2, kcal: 341, date: '2026-08-27' },
  { id: 's2', name: 'Free ride', when: 'WED', min: 41, km: 14.8, kcal: 402, date: '2026-08-26' },
  { id: 's3', name: 'Endurance 45', when: 'MON', min: 45, km: 16.1, kcal: 458, date: '2026-08-24' },
];
```

- [ ] **Step 4: Run → PASS.** — [ ] **Step 5: Commit** `git commit -am "feat(engine): 3 built-in programs + seed history"`

### Task 3.3: Ride engine reducer (start / tick / advance / pause / finish)

The heart of the app. Pure functions on `Session`. The tick consumes a `BikeReading`: it uses the reading's `cadence` (real bike) and derives speed/distance/calories when the bike omits them; a program tick auto-advances intervals and snaps resistance to the new segment's target (matching the prototype).

**Files:**
- Create: `src/engine/rideEngine.ts`, `__tests__/rideEngine.test.ts`

**Interfaces:**
- Consumes: `Session, Program, Summary` types; `deriveSpeedKmh`, `deriveKcalPerSec`; `totalDur`; `BikeReading`.
- Produces:
  - `startSession(program: Program | null): Session`
  - `tick(s: Session, r: BikeReading): { session: Session; finished: boolean }`
  - `togglePause(s: Session): Session`
  - `currentSegment(s: Session): Segment | null`
  - `buildSummary(s: Session, history: Ride[]): Summary`
  - `resCue(s: Session): string` (`' ▲n'` / `' ▼n'` / `''`)

- [ ] **Step 1: Write failing tests**

`__tests__/rideEngine.test.ts`:
```ts
import { startSession, tick, togglePause, buildSummary, resCue } from '../src/engine/rideEngine';
import { PROGRAMS } from '../src/engine/programs';
import type { BikeReading } from '../src/ble/BikeSource';
const R = (cadence: number): BikeReading => ({ cadence, ts: 0 });

test('free ride accumulates distance and calories from cadence', () => {
  let s = startSession(null); s = { ...s, resistance: 10 };
  const { session } = tick(s, R(90));
  expect(session.elapsed).toBe(1);
  expect(session.distanceKm).toBeGreaterThan(0);
  expect(session.calories).toBeGreaterThan(0);
});

test('paused tick does not advance time or distance', () => {
  let s = togglePause(startSession(null));
  const { session } = tick(s, R(90));
  expect(session.elapsed).toBe(0);
  expect(session.distanceKm).toBe(0);
});

test('program advances to next interval when segment duration elapses', () => {
  let s = startSession(PROGRAMS[2]); // PYRAMID: seg0 WARM UP dur 120
  for (let i = 0; i < 120; i++) s = tick(s, R(80)).session;
  expect(s.segIdx).toBe(1); // advanced to CLIMB 1
  expect(s.resistance).toBe(12); // snapped to new segment target
});

test('finishes after the last interval', () => {
  let s = startSession({ id: 't', name: 'T', desc: '', segs: [{ label: 'A', dur: 2, lo: 80, hi: 80, res: 10 }] });
  let out = tick(s, R(80)); expect(out.finished).toBe(false);
  out = tick(out.session, R(80)); // second tick reaches dur → finish
  expect(out.finished).toBe(true);
});

test('resCue shows delta to interval target', () => {
  let s = startSession(PROGRAMS[0]); // seg0 res 8
  s = { ...s, resistance: 6 };
  expect(resCue(s)).toBe(' ▲2');
  s = { ...s, resistance: 11 };
  expect(resCue(s)).toBe(' ▼3');
});

test('PB when distance beats history max', () => {
  const s = { ...startSession(null), elapsed: 60, distanceKm: 20, calories: 300, rpmSum: 5400, rpmN: 60 };
  const sum = buildSummary(s, [{ id: 'x', name: 'x', when: 'MON', min: 30, km: 16.1, kcal: 400, date: '' }]);
  expect(sum.pb).toBe(true); expect(sum.avgRpm).toBe(90);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`src/engine/rideEngine.ts`:
```ts
import type { Session, Program, Segment, Summary, Ride } from './types';
import type { BikeReading } from '../ble/BikeSource';
import { deriveSpeedKmh, deriveKcalPerSec } from './formulas';

export function startSession(program: Program | null): Session {
  return {
    program, elapsed: 0, segIdx: 0, segElapsed: 0, paused: false,
    cadence: 62, resistance: program ? program.segs[0].res : 8,
    speedKmh: 0, distanceKm: 0, calories: 0, rpmSum: 0, rpmN: 0,
  };
}
export const currentSegment = (s: Session): Segment | null => s.program ? s.program.segs[s.segIdx] : null;
export const togglePause = (s: Session): Session => ({ ...s, paused: !s.paused });

export function tick(s: Session, r: BikeReading): { session: Session; finished: boolean } {
  if (s.paused) return { session: s, finished: false };
  let segIdx = s.segIdx, segElapsed = s.segElapsed + 1, resistance = r.resistance ?? s.resistance;
  if (s.program) {
    let seg = s.program.segs[segIdx];
    if (segElapsed >= seg.dur) {
      segIdx++; segElapsed = 0;
      if (segIdx >= s.program.segs.length) return { session: { ...s, elapsed: s.elapsed + 1 }, finished: true };
      resistance = s.program.segs[segIdx].res; // snap to new target (real bike: read broadcast instead)
    }
  }
  const cadence = r.cadence;
  const speedKmh = r.speedKmh ?? deriveSpeedKmh(cadence, resistance);
  return {
    session: {
      ...s, elapsed: s.elapsed + 1, segIdx, segElapsed, resistance, cadence, speedKmh,
      distanceKm: r.distanceKm ?? s.distanceKm + speedKmh / 3600,
      calories: r.calories ?? s.calories + deriveKcalPerSec(cadence, resistance),
      rpmSum: s.rpmSum + cadence, rpmN: s.rpmN + 1,
    },
    finished: false,
  };
}
export function resCue(s: Session): string {
  const seg = currentSegment(s); if (!seg) return '';
  if (seg.res > s.resistance) return ` ▲${seg.res - s.resistance}`;
  if (seg.res < s.resistance) return ` ▼${s.resistance - seg.res}`;
  return '';
}
export function buildSummary(s: Session, history: Ride[]): Summary {
  const km = s.distanceKm;
  const pb = km > Math.max(0, ...history.map(h => h.km));
  return { name: s.program ? s.program.name : 'Free ride', sec: s.elapsed, km,
    kcal: Math.round(s.calories), avgRpm: s.rpmN ? Math.round(s.rpmSum / s.rpmN) : 0, pb };
}
```

- [ ] **Step 4: Run → PASS (all 6).** — [ ] **Step 5: Commit** `git commit -am "feat(engine): pure ride reducer with interval advance, pause, PB"`

---

## Phase 4 — Stores + Live Ride with real data

### Task 4.1: Persistence repository

**Files:**
- Create: `src/persistence/repository.ts`, `__tests__/repository.test.ts`

**Interfaces:**
- Consumes: `AsyncStorage`; `Ride`, `Settings`.
- Produces: `loadSettings()`, `saveSettings(s)`, `loadHistory()`, `saveHistory(rides)` (all `Promise`s); default settings `{ units:'km', weeklyGoalKm:60, lastDeviceId:null }`.

- [ ] **Step 1: Write failing test** (mock AsyncStorage)

`__tests__/repository.test.ts`:
```ts
jest.mock('@react-native-async-storage/async-storage', () => {
  const m: Record<string,string> = {};
  return { setItem: (k:string,v:string)=>{m[k]=v;return Promise.resolve();},
           getItem: (k:string)=>Promise.resolve(m[k] ?? null) };
});
import { loadSettings, saveSettings, saveHistory, loadHistory } from '../src/persistence/repository';
test('round-trips settings with defaults', async () => {
  expect((await loadSettings()).units).toBe('km');
  await saveSettings({ units:'mi', weeklyGoalKm:60, lastDeviceId:'abc' });
  expect((await loadSettings()).lastDeviceId).toBe('abc');
});
test('round-trips history', async () => {
  await saveHistory([{ id:'1', name:'X', when:'TODAY', min:20, km:9, kcal:200, date:'2026-08-29' }]);
  expect((await loadHistory())[0].km).toBe(9);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`src/persistence/repository.ts`:
```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Ride, Settings } from '../engine/types';
const K = { settings: 'pulse.settings', history: 'pulse.history' };
const DEFAULTS: Settings = { units: 'km', weeklyGoalKm: 60, lastDeviceId: null };
export async function loadSettings(): Promise<Settings> {
  const raw = await AsyncStorage.getItem(K.settings);
  return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
}
export const saveSettings = (s: Settings) => AsyncStorage.setItem(K.settings, JSON.stringify(s));
export async function loadHistory(): Promise<Ride[] | null> {
  const raw = await AsyncStorage.getItem(K.history); return raw ? JSON.parse(raw) : null;
}
export const saveHistory = (rides: Ride[]) => AsyncStorage.setItem(K.history, JSON.stringify(rides));
```

- [ ] **Step 4: Run → PASS.** — [ ] **Step 5: Commit** `git commit -am "feat(persist): AsyncStorage repository for settings + history"`

### Task 4.2: History + settings stores (Zustand, hydrated)

**Files:**
- Create: `src/store/historyStore.ts`, `src/store/settingsStore.ts`, `__tests__/historyStore.test.ts`

**Interfaces:**
- Produces:
  - `useHistory`: `{ rides: Ride[]; hydrate(): Promise<void>; addRide(r: Ride): void; monthStats(): {km:number;rides:number;hours:number}; maxKm(): number }`
  - `useSettings`: `{ units; weeklyGoalKm; lastDeviceId; hydrate(); setUnits(u); setLastDevice(id) }`
  - Both persist on mutation.

- [ ] **Step 1: Write failing test**

`__tests__/historyStore.test.ts`:
```ts
jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: ()=>Promise.resolve(), getItem: ()=>Promise.resolve(null) }));
import { useHistory } from '../src/store/historyStore';
test('addRide prepends and updates maxKm', async () => {
  await useHistory.getState().hydrate(); // seeds 3
  useHistory.getState().addRide({ id:'n', name:'HIIT 30', when:'TODAY', min:22, km:20, kcal:300, date:'2026-08-29' });
  expect(useHistory.getState().rides[0].id).toBe('n');
  expect(useHistory.getState().maxKm()).toBe(20);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement** both stores.

`src/store/historyStore.ts`:
```ts
import { create } from 'zustand';
import type { Ride } from '../engine/types';
import { SEED_HISTORY } from '../engine/programs';
import { loadHistory, saveHistory } from '../persistence/repository';

type S = {
  rides: Ride[];
  hydrate: () => Promise<void>;
  addRide: (r: Ride) => void;
  maxKm: () => number;
  monthStats: () => { km: number; rides: number; hours: number };
};
export const useHistory = create<S>((set, get) => ({
  rides: [],
  hydrate: async () => set({ rides: (await loadHistory()) ?? SEED_HISTORY }),
  addRide: (r) => { const rides = [r, ...get().rides]; set({ rides }); saveHistory(rides); },
  maxKm: () => Math.max(0, ...get().rides.map(r => r.km)),
  // Prototype presented aggregate month figures with baked-in offsets; keep the same display math.
  monthStats: () => {
    const rs = get().rides;
    return { km: Math.round(rs.reduce((a, r) => a + r.km, 0) + 144),
      rides: rs.length + 14,
      hours: +(((rs.reduce((a, r) => a + r.min, 0) + 430) / 60).toFixed(1)) };
  },
}));
```

`src/store/settingsStore.ts` (analogous; `setUnits`/`setLastDevice` persist via `saveSettings`).

- [ ] **Step 4: Run → PASS.** — [ ] **Step 5: Commit** `git commit -am "feat(store): history + settings stores with hydration"`

### Task 4.3: bikeStore — wire source → engine at 1 Hz

Connects a `BikeSource` to the ride engine. Buffers the latest `BikeReading`; a 1 s interval calls `tick` and, for the simulator, pushes the current interval target back into the source so cadence eases toward it.

**Files:**
- Create: `src/store/bikeStore.ts`, `__tests__/bikeStore.test.ts`

**Interfaces:**
- Consumes: `BikeSource`, `SimulatedBikeSource`, engine funcs, `useHistory`.
- Produces: `useBike`: `{ source, conn, session|null, setSource(src), startRide(program|null), endRide(), setPaused, resInc(), resDec(), summary|null, clearSummary() }`.

- [ ] **Step 1: Write failing test** (drive with the simulator; fake timers)

`__tests__/bikeStore.test.ts`:
```ts
jest.mock('@react-native-async-storage/async-storage', () => ({ setItem:()=>Promise.resolve(), getItem:()=>Promise.resolve(null) }));
import { useBike } from '../src/store/bikeStore';
import { SimulatedBikeSource } from '../src/ble/SimulatedBikeSource';

test('startRide then ticks accumulate elapsed', async () => {
  const src = new SimulatedBikeSource(); await src.connect('sim');
  useBike.getState().setSource(src);
  useBike.getState().startRide(null);
  await new Promise(r => setTimeout(r, 1100)); // >1 engine second
  expect(useBike.getState().session!.elapsed).toBeGreaterThanOrEqual(1);
  useBike.getState().endRide();
  expect(useBike.getState().summary).not.toBeNull();
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement**

`src/store/bikeStore.ts`:
```ts
import { create } from 'zustand';
import type { BikeSource, BikeReading, ConnState } from '../ble/BikeSource';
import { SimulatedBikeSource } from '../ble/SimulatedBikeSource';
import type { Program, Session, Summary } from '../engine/types';
import { startSession, tick, togglePause, currentSegment, buildSummary } from '../engine/rideEngine';
import { useHistory } from './historyStore';

type S = {
  source: BikeSource; conn: ConnState; session: Session | null; summary: Summary | null;
  _latest: BikeReading; _timer: any; _unsub: (() => void) | null;
  setSource: (src: BikeSource) => void;
  startRide: (p: Program | null) => void;
  endRide: () => void;
  setPaused: () => void;
  resInc: () => void; resDec: () => void;
  clearSummary: () => void;
};
export const useBike = create<S>((set, get) => ({
  source: new SimulatedBikeSource(), conn: 'idle', session: null, summary: null,
  _latest: { cadence: 0, ts: 0 }, _timer: null, _unsub: null,
  setSource: (src) => { set({ source: src }); src.onState(conn => set({ conn })); },
  startRide: (program) => {
    const src = get().source;
    const unsub = src.onData(r => set({ _latest: r }));
    set({ session: startSession(program), summary: null, _unsub: unsub });
    const timer = setInterval(() => {
      const st = get(); if (!st.session) return;
      if (src instanceof SimulatedBikeSource && !st.session.paused) {
        const seg = currentSegment(st.session);
        src.setTarget(seg ? (seg.lo + seg.hi) / 2 : 85);
        src.setResistance(st.session.resistance);
      }
      const { session, finished } = tick(st.session, st._latest);
      set({ session });
      if (finished) get().endRide();
    }, 1000);
    set({ _timer: timer });
  },
  endRide: () => {
    const st = get(); if (st._timer) clearInterval(st._timer); st._unsub?.();
    const summary = st.session ? buildSummary(st.session, useHistory.getState().rides) : null;
    set({ session: null, summary, _timer: null, _unsub: null });
  },
  setPaused: () => set(st => ({ session: st.session ? togglePause(st.session) : null })),
  resInc: () => set(st => st.session ? { session: { ...st.session, resistance: Math.min(32, st.session.resistance + 1) } } : {}),
  resDec: () => set(st => st.session ? { session: { ...st.session, resistance: Math.max(1, st.session.resistance - 1) } } : {}),
  clearSummary: () => set({ summary: null }),
}));
```

- [ ] **Step 4: Run → PASS.** — [ ] **Step 5: Commit** `git commit -am "feat(store): bikeStore wires source to ride engine at 1 Hz"`

### Task 4.4: Live Ride screen (real + simulated data)

**Files:**
- Create: `src/screens/LiveRideScreen.tsx`, `src/ui/components/MetricColumn.tsx`
- Test: `__tests__/liveRide.test.tsx`

Port markup verbatim from `design/Yesoul PULSE App.dc.html` lines 84–125: header (mode left / clock right); program-only interval progress bar (one flex segment per interval; done=accent, current=text, upcoming=surface) and phase banner (work=accent bg/dark text, recover/warmup/cooldown=`#241f27` bg/light text); PAUSED outlined banner; 200px cadence hero + target label; resistance segmented control `[−] RESISTANCE n ▲/▼ [+]`; 4-metric row (speed/dist/kcal/time with min-width 70 to avoid layout shift); PAUSE/END buttons. Bind values from `useBike` + `renderVals`-equivalent selectors (mirror the prototype's `renderVals`, reusing engine helpers).

- [ ] **Step 1: Write failing test**

```tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { LiveRideScreen } from '../src/screens/LiveRideScreen';
import { useBike } from '../src/store/bikeStore';
import { SimulatedBikeSource } from '../src/ble/SimulatedBikeSource';

test('renders cadence and metric labels during a ride', async () => {
  const src = new SimulatedBikeSource(); await src.connect('sim');
  useBike.getState().setSource(src); useBike.getState().startRide(null);
  const { getByText } = render(<LiveRideScreen onEnd={() => {}} />);
  await waitFor(() => getByText('KCAL'));
  getByText('FREE RIDE'); getByText('RPM · FIND YOUR RHYTHM');
});
```

- [ ] **Step 2: Run → FAIL.** — [ ] **Step 3: Implement** the screen (transcribe styles; derive display strings with `convDist/convSpeed`, `fmt(sec)`, `resCue`, `currentSegment`). END calls `useBike.endRide()` then `onEnd()`.
- [ ] **Step 4: Run → PASS.** — [ ] **Step 5: Commit** `git commit -am "feat(screen): Live Ride dashboard bound to bikeStore"`

---

## Phase 5 — Summary + remaining screens + navigation

### Task 5.1: Summary screen + save to history

**Files:** Create `src/screens/SummaryScreen.tsx`; Test `__tests__/summary.test.tsx`.
Port from prototype lines 127–146 (RIDE COMPLETE 58/800; sub name·TODAY; PB chip when `summary.pb`; orange DISTANCE hero 76px + unit; attached TIME/KCAL/AVG RPM row; off-white DONE). DONE builds a `Ride` from the summary and calls `useHistory.addRide`, then `useBike.clearSummary()` + navigate Home.

- [ ] **Step 1: Failing test** — renders RIDE COMPLETE + distance from a seeded summary; pressing DONE calls `addRide`.
```tsx
// set useBike summary via endRide from a short sim ride, render, assert getByText('RIDE'), press DONE, assert history grew
```
- [ ] **Step 2: Run → FAIL.** — [ ] **Step 3: Implement.** — [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** `git commit -am "feat(screen): Ride Summary + save to history"`

### Task 5.2: Home screen

**Files:** Create `src/screens/HomeScreen.tsx`, `src/ui/components/Bars.tsx`; Test `__tests__/home.test.tsx`.
Port lines 44–82: time-of-day greeting (`MORNING/AFTERNOON/EVENING, SAM`), `● S3 CONNECTED · READY TO RIDE`, orange START RIDE hero (→ `startRide(null)` + navigate Ride), two program cards (first 2 of `PROGRAMS`, press → `startRide(p)`), THIS WEEK bars, LAST RIDE meta from `useHistory.rides[0]` via `convDist`.
- [ ] **Step 1: Failing test** (greeting + START RIDE present; pressing a program card starts a ride). — [ ] Steps 2–4 TDD. — [ ] **Step 5: Commit** `git commit -am "feat(screen): Home"`

### Task 5.3: Rides history screen

**Files:** Create `src/screens/RidesScreen.tsx`; Test `__tests__/rides.test.tsx`.
Port lines 148–167: YOUR RIDES + current month; 3 stat cards from `useHistory.monthStats()` (DISTANCE orange); RECENT rows from `rides` (name upper, `when · min MIN · kcal KCAL`, right km orange via `convDist`).
- [ ] TDD (assert a seeded ride name + its km render). — [ ] **Commit** `git commit -am "feat(screen): Rides history"`

### Task 5.4: Programs screen

**Files:** Create `src/screens/ProgramsScreen.tsx`; Test `__tests__/programs-screen.test.tsx`.
Port lines 169–191: PROGRAMS title; one card per `PROGRAMS` (name 26/800 + total-min meta via `totalDur`; desc; intensity strip — one bar per segment, `flex=max(1,round(dur/30))`, `height=round(4+(res/20)*18)px`, surface color; orange START → `startRide(p)` + navigate Ride).
- [ ] TDD (all 3 program names render; START starts a ride). — [ ] **Commit** `git commit -am "feat(screen): Programs"`

### Task 5.5: Profile screen

**Files:** Create `src/screens/ProfileScreen.tsx`; Test `__tests__/profile.test.tsx`.
Port lines 193–212: avatar + SAM + RIDING SINCE MAY 2026; WEEKLY GOAL card (`weekKm / goal`, pct orange, progress fill) from `useHistory` sum vs `useSettings.weeklyGoalKm` (respect units); SETTINGS rows — BIKE `YESOUL S3-4F2A · CONNECTED`; UNITS toggles `useSettings.setUnits` between KILOMETERS/MILES; EXPORT TO STRAVA `COMING SOON`.
- [ ] TDD (WEEKLY GOAL renders; tapping UNITS flips label). — [ ] **Commit** `git commit -am "feat(screen): Profile with units toggle"`

### Task 5.6: Navigation + custom tab bar

**Files:** Create `src/navigation/RootNavigator.tsx`, `src/navigation/TabBar.tsx`; Modify `App.tsx`.
Tabs Home/Rides/Programs/Profile with the custom `TabBar` (2px `#241f27` top border, active orange, `14/700/.15em`, hidden during ride); Connect/LiveRide/Summary as full-screen modal routes. Screen selection follows `useBike.session`/`summary`/`conn` (session→Ride, summary→Summary). Port tab bar from prototype lines 214–221.
- [ ] **Step 1: Failing test** — render `RootNavigator`, assert the 4 tab labels; simulate `startRide` and assert tab bar hidden. — [ ] Steps 2–4 TDD. — [ ] **Step 5: Commit** `git commit -am "feat(nav): tabs + modals + custom tab bar"`

---

## Phase 6 — Integration polish

### Task 6.1: Font loading + App bootstrap + demo/real source selection

**Files:** Modify `App.tsx`; add `src/config.ts` (`USE_SIMULATED` flag, default false; a hidden dev toggle).
- [ ] **Step 1:** `expo-font` load Barlow Condensed (500/600/700/800) with a splash hold until loaded; `npx expo install expo-font expo-splash-screen`.
- [ ] **Step 2:** On mount: `useHistory.hydrate()`, `useSettings.hydrate()`, then `useBike.setSource(USE_SIMULATED ? new SimulatedBikeSource() : new FtmsBikeSource())`.
- [ ] **Step 3:** Render `RootNavigator`. Manual: run on device, confirm Barlow Condensed renders (condensed numerals) and all tabs navigate.
- [ ] **Step 4: Commit** `git commit -am "feat(app): font loading, store hydration, source selection"`

### Task 6.2: Auto-reconnect on launch

**Files:** Modify `App.tsx` / `src/store/bikeStore.ts`; add `attemptReconnect()`.
On launch, if `useSettings.lastDeviceId` and using `FtmsBikeSource`, try `source.connect(id)`; on success go straight to Home (skip Connect). On Connect success, `useSettings.setLastDevice(device.id)`. On failure, fall back to the Connect scan.
- [ ] **Step 1: Failing test** — with a simulator whose `connect` resolves and a stored id, `attemptReconnect()` sets `conn='connected'`. — [ ] Steps 2–4 TDD. — [ ] **Step 5: Commit** `git commit -am "feat(ble): auto-reconnect to last device on launch"`

### Task 6.3: Resistance control capability gating

**Files:** Modify `LiveRideScreen.tsx`, `bikeStore.ts`.
If `source.capabilities.control` is true, `resInc/resDec` also call `source.setResistance(next)`. If false, the +/− still adjust the local target for the cue but the on-screen note reflects read-only (per spec §5). 
- [ ] **Step 1: Failing test** — with a control-capable simulator spy, `resInc` triggers `setResistance`. — [ ] Steps 2–4 TDD. — [ ] **Step 5: Commit** `git commit -am "feat(ble): gate resistance writes on control capability"`

### Task 6.4: Full-suite green + on-device end-to-end

**Files:** none (verification).
- [ ] **Step 1:** `npm test` — all suites pass. `npm run tsc` — clean.
- [ ] **Step 2:** On the physical iPhone with the real S3: connect → free ride shows live cadence → a full PYRAMID 20 program auto-advances intervals and phase banner → END → Summary → DONE → ride appears at top of Rides and survives an app restart (persistence). Toggle units in Profile and confirm labels/values convert.
- [ ] **Step 3: Commit** `git commit --allow-empty -m "test: full suite green + on-device end-to-end verified"`

---

## Self-Review

**Spec coverage:**
- §3.1 BikeSource seam → Tasks 1.1, 2.1, 2.2, 4.3. ✓
- §3.2 pure ride engine + formulas → Tasks 3.1, 3.3. ✓
- §3.3 module structure → mapped in File Structure + per-task file paths. ✓
- §4 data models + seed data → Tasks 3.1, 3.2. ✓
- §5 FTMS parse / control / CSC fallback / auto-reconnect → Tasks 1.2, 1.3, 2.2, 6.2 (CSC fallback flagged as backlog in Task 2.4 if the S3 lacks FTMS cadence — noted, not built unless observed). ✓
- §6 all 7 screens + nav → Tasks 2.3, 4.4, 5.1–5.6. ✓
- §7 persistence → Tasks 4.1, 4.2, 5.1. ✓
- §8 testing → every logic task is TDD; on-device checks in 2.4, 6.4. ✓
- §9 risks → control gating (6.3), reconnect fallback (6.2), on-device parser validation (2.4). ✓

**Placeholder scan:** No "TBD/handle edge cases" left as work items. Screen tasks 5.2–5.5 intentionally reference exact prototype line ranges + exact data bindings rather than re-transcribing ~200 lines of styled JSX per screen — the prototype file is in-repo and is the pixel source of truth per the spec; each still carries a concrete render test. This is a deliberate DRY choice, not a placeholder.

**Type consistency:** `BikeReading`, `Session`, `Summary`, `Ride`, `Program`, `Segment`, `Units` are defined once (Tasks 1.1, 3.1) and reused verbatim. Engine functions (`startSession`, `tick`, `togglePause`, `currentSegment`, `buildSummary`, `resCue`) keep identical signatures across the store (4.3) and screens (4.4, 5.1). Store hooks (`useBike`, `useHistory`, `useSettings`) keep consistent member names across consumers.
