# Yesoul PULSE

iOS companion app for a **Yesoul S3** spin bike — pairs over Bluetooth (FTMS), drives a live ride dashboard, runs interval programs, and tracks history. Built with React Native + Expo.

> **This repo currently contains the planning artifacts only** (spec + implementation plan + design handoff). The app itself is built on macOS from the plan below.

## Contents

| Path | What it is |
|---|---|
| `docs/superpowers/specs/2026-08-29-yesoul-pulse-app-design.md` | Architecture & design spec. Start here. |
| `docs/superpowers/plans/2026-08-29-yesoul-pulse-app.md` | Step-by-step, TDD implementation plan. |
| `design/` | Finalized design handoff — **pixel-perfect source of truth** for the UI. |
| `design/Yesoul PULSE App.dc.html` | Interactive prototype of all 7 screens (the mockup). |
| `design/README.md` | Design tokens, type scale, per-screen spec. |
| `handoff/` | Original handoff zip + extraction. |

## Build environment

- **macOS** with Xcode (real Bluetooth requires a **physical iPhone** — the iOS Simulator has no BLE radio).
- Node + Expo CLI; an Apple Developer account for on-device installs.
- BLE uses `react-native-ble-plx` → an Expo **dev client** build (not Expo Go).

## Getting started (on the Mac)

1. Read the spec, then the plan.
2. Follow the plan from **Task 0.1** (scaffolds the Expo app). Each task is TDD and ends in a commit.
3. `npm test` runs the pure-logic suites (parser, engine, stores) with no device; on-device verification steps are called out explicitly (Tasks 2.4, 6.4).

## Stack

React Native · Expo (dev client) · TypeScript · `react-native-ble-plx` · Zustand · React Navigation · AsyncStorage · Jest + React Native Testing Library.
