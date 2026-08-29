# Agent Handoff — Yesoul PULSE

You are picking up this project on **macOS** to build it. Planning is done; your job is to execute the plan.

## Start here (read in this order)

1. `docs/superpowers/specs/2026-08-29-yesoul-pulse-app-design.md` — the architecture & design spec.
2. `docs/superpowers/plans/2026-08-29-yesoul-pulse-app.md` — the step-by-step, TDD implementation plan. **This is what you execute.**
3. `design/Yesoul PULSE App.dc.html` + `design/README.md` — the **pixel-perfect UI source of truth**. Screen tasks reference exact line ranges in the prototype; port them faithfully.

## How to execute

The plan is written for task-by-task execution with the Superpowers skills. Use **`superpowers:subagent-driven-development`** (a fresh subagent per task with review between tasks) or **`superpowers:executing-plans`** (inline, batched with checkpoints). Each task is TDD and ends in a commit — keep that rhythm. Do not batch multiple tasks into one commit.

Begin at **Task 0.1** (scaffolds the Expo app into this repo). Later tasks assume the app lives here alongside `docs/` and `design/`.

## Environment (must-knows)

- **iOS only.** Build with Expo + Xcode. Requires an **Apple Developer account** for on-device installs.
- **Real Bluetooth needs a physical iPhone** — the iOS Simulator has no BLE radio. The plan marks exactly which steps require the device (Tasks 2.4, 6.4); everything else is proven by unit tests with no hardware.
- BLE uses `react-native-ble-plx`, a native module → **not Expo-Go compatible**. You need an Expo **dev client** build (`npx expo run:ios --device`).
- `npm test` runs the pure-logic suites (parser, ride engine, stores). Run it continuously; it needs no device.

## Non-negotiable constraints (from the spec's Global Constraints)

- **FTMS cadence is in 0.5-rpm units — divide by 2.** (Already handled/tested in the parser task; don't undo it.)
- Design tokens are exact: bg `#121014`, accent `#FF5C1F`, border `#332E36`, hairline `#241f27`, text `#F4F1EC`, muted `#9B959D`. **Border-radius 0 everywhere except circles.** 2px borders. Font **Barlow Condensed**. All copy UPPERCASE as in the prototype.
- Never `import` `react-native-ble-plx` outside `src/ble/`. The rest of the app talks to the `BikeSource` interface only, so the simulator and the real bike stay interchangeable.
- Resistance clamps to **1–32**. Units `mi` factor is **0.621**.

## Open questions to resolve on-device (spec §9)

1. Does this specific S3 support **FTMS Control Point** resistance writes, or is it read-only? Confirm in Task 2.4; the plan handles either outcome (Task 6.3 gates writes on `capabilities.control`).
2. Does the S3 broadcast cadence over FTMS, or only CSC (`0x1816`)? If cadence is missing over FTMS, backlog a CSC-fallback `BikeSource` (noted in Task 2.4).
3. Apple Developer account available for signing?

## Git

- Remote is `origin` → https://github.com/gianyabut/spin (branch `main`).
- Commit per task (the plan gives the messages). Push regularly.
