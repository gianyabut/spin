# Handoff: Yesoul PULSE — Spin Bike Companion App

## Overview
PULSE is a mobile companion app for a Yesoul S3 spin bike connected over Bluetooth (FTMS). It replaces the paid Yesoul app for a single rider: pair with the bike, ride free or follow structured interval programs, see live metrics (cadence, resistance, speed, distance, calories, time), and review ride history and weekly goals. The design direction is "motivational performance": giant condensed numerals, hard-edged orange color blocking, dark gym-friendly UI. No rounded cards, no gradients.

## About the Design Files
The files in this bundle are **design references created in HTML** — interactive prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these designs in the target codebase's environment** (React Native, Flutter, SwiftUI, Kotlin, etc.) using its established patterns. If no codebase exists yet, choose the framework best suited to Bluetooth LE access on the user's phone platform — React Native (react-native-ble-plx), Flutter (flutter_blue_plus), or native — and implement the designs there.

- `Yesoul PULSE App.dc.html` — the chosen direction as a working interactive prototype (all 7 screens, simulated bike data). **This is the spec.**
- `Yesoul Spin App Mockups.dc.html` — the exploration file with 3 directions; option **1b PULSE** was chosen. Reference only.
- `ios-frame.jsx` — iPhone device chrome used by the prototypes; not part of the app itself.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, and interactions are final intent. Recreate pixel-perfectly, adjusting only for platform conventions (safe areas, native navigation feel) and real data.

## Design Tokens

Colors:
- Background: `#121014` (near-black plum)
- Surface / borders: `#332E36` (2px solid borders everywhere; hairline rows use `#241f27`)
- Foreground text: `#F4F1EC` (warm off-white)
- Muted text: `#9B959D`
- Accent: `#FF5C1F` (orange) — connected status, primary actions, active tab, progress fills, interval "done" segments
- On-accent text: `#121014`
- Accent hover: `#ff6e38`

Typography — single family: **Barlow Condensed** (Google Fonts), weights 500–800:
- Hero numeral (live cadence): 200px / 800 / line-height .95 / letter-spacing -0.01em
- Screen titles ("RIDE COMPLETE", "YOUR RIDES"): 34–58px / 800
- Big CTA ("START RIDE"): 42px / 800
- Metric values: 30–38px / 700–800
- Card titles: 20–26px / 700–800
- Labels/eyebrows: 12–15px / 600–700 / letter-spacing .1–.3em / UPPERCASE / muted color
- Body meta: 13–15px / 500–600

Shape & spacing:
- **Border radius: 0 everywhere** except circles (avatar, scan rings). Buttons and cards are sharp rectangles.
- Borders: 2px solid `#332E36`; active/selected borders switch to `#FF5C1F`
- Screen horizontal padding: 22px; top clear of status bar (~64px in prototype); bottom safe area respected
- Gaps: 12px between sibling cards, 4px between interval segments
- Primary buttons: full-width blocks, 14–17px vertical padding, 800 weight, .15em tracking, UPPERCASE

## Screens / Views

### 1. Connect (first launch / not paired)
Purpose: scan for and pair the bike.
- Title "CONNECT YOUR BIKE" 44px/800, two lines; below it "SCANNING FOR BLUETOOTH FTMS_" 15px/600 muted with orange blinking-cursor underscore.
- Centered scan motif: 3 concentric circles — 140px and 96px rings with 2px `#332E36` borders, innermost 54px solid orange disc labeled "SCAN" 13px/800 dark text.
- While scanning: centered hint "MAKE SURE THE BIKE CONSOLE IS AWAKE" 13px/600 in `#332E36`.
- After discovery (~1.6s in prototype): "1 DEVICE FOUND" eyebrow, then device row with 2px **orange** border: name "YESOUL S3-4F2A" 20px/700, sub "SMART BIKE · FTMS" 13px muted; right side 4 signal bars (5px wide, heights 8/13/18/23px, first three orange, last `#332E36`).
- Bottom: full-width orange CONNECT button (18px/800, .15em). Tapping navigates to Home.

### 2. Home
Purpose: launch a ride, see week progress.
- Header row: greeting "MORNING/AFTERNOON/EVENING, SAM" 34px/800 (time-of-day aware) + 38px circular avatar (taps to Profile).
- Status line: "● S3 CONNECTED · READY TO RIDE" 15px/600 orange.
- Hero CTA: solid orange block, 24px padding — "START RIDE" 42px/800 + "FREE RIDE · JUST PEDAL" 15px/600, right-aligned "→" 42px. Starts a free ride.
- Two program cards side by side (2px border, hover/pressed border turns orange): name 22px/700 + description 13px muted. Tap starts that program.
- "THIS WEEK" eyebrow, then 7 flex bars (80px tall track, 8px gap): ridden days solid orange at varying heights, rest days 8%-height `#332E36` stubs, today a 2px-dashed outline bar. Day labels MO–SA + "TODAY" (orange) 12px.
- Footer row above tab bar, separated by 2px border-top: "LAST RIDE" label left, "14.8 KM · 41 MIN · 402 KCAL" 20px/700 right.
- Tab bar (see Navigation).

### 3. Live Ride (free ride and program share this screen)
Purpose: the in-workout dashboard. Landscape not required; portrait one-hand glanceable.
- Header: left = "FREE RIDE" or "HIIT 30 · INTERVAL 6/18"; right = elapsed "23:41" (free) or countdown "14:22 LEFT" (program). Both 15px/600 muted.
- **Program only — interval progress bar:** one flex segment per interval, 6px tall, 4px gaps, flex-grow proportional to duration (≈dur/30s). Done = orange, current = off-white, upcoming = `#332E36`.
- **Program only — phase banner:** full-width block, 10px×16px padding: label left ("PUSH — SPRINT" / "RECOVER" / "WARM UP" / "COOL DOWN"), phase countdown right, both 20px/800. Work phases: orange bg + dark text. Recovery/warm-up/cool-down: `#241f27` bg + light text.
- **Hero cadence:** current RPM centered, 200px/800. Below: "RPM · TARGET 90–100" (program) or "RPM · FIND YOUR RHYTHM" (free), 17px/600, .3em tracking, muted.
- **Resistance control:** centered segmented control — [−] / "RESISTANCE 16 ▲2" / [+]. Middle segment 2px orange border, orange text 17px/700; ▲n/▼n cue appears when current resistance differs from the interval's target. − / + buttons 2px `#332E36` border, press-state fills `#332E36`. (On the real bike resistance is read via FTMS; the +/− is a UI affordance if the bike supports control, otherwise show read-only value + cue.)
- **Metrics row:** 4 columns — speed (1 decimal), distance (1 decimal), calories (integer), elapsed time. Values 36px/700, labels 13px/.2em muted (KM/H · KM · KCAL · TIME, or MPH/MI when units=miles).
- **Controls:** two half-width buttons — PAUSE (2px border, toggles to RESUME; hover border turns off-white) and END (solid off-white, dark text). Pausing freezes all accumulation and shows a "PAUSED" outlined banner (2px off-white border, 16px/800/.3em) under the header.
- No tab bar during a ride.

### 4. Ride Summary (after END or program completion)
- "RIDE COMPLETE" 58px/800 two lines; sub "HIIT 30 · TODAY" 15px/600 muted.
- If new distance PB: off-white chip "★ NEW DISTANCE PB" 15px/800, dark text.
- Hero stat: solid orange block — "DISTANCE" eyebrow + value 76px/800 with unit 28px.
- Attached beneath (2px border, no top border): 3 equal columns TIME / KCAL / AVG RPM, values 32px/700, 2px dividers.
- Bottom: full-width off-white DONE button → saves ride to top of history, returns Home.

### 5. Rides (history)
- Title "YOUR RIDES" 34px/800, sub "AUGUST 2026" (current month).
- 3 stat cards: DISTANCE (solid orange, dark text), RIDES, HOURS (2px-border cards). Values 30px/800.
- "RECENT" eyebrow, then rows separated by 2px `#241f27` rules: left = ride name 20px/700 + meta "THU · 30 MIN · 341 KCAL" 13px muted; right = distance "11.2 KM" 26px/800 orange. New rides prepend with when = "TODAY".

### 6. Programs
- Title "PROGRAMS" 34px/800, sub "STRUCTURED INTERVALS FOR THE S3".
- One card per program (2px border, hover orange): header row name 26px/800 + total minutes right 15px/700 muted; description 14px muted; **intensity strip** — one bar per segment, flex ∝ duration, height ∝ resistance (4–22px), `#332E36`; full-width orange START button 15px/800.
- Ship with 3 programs (see Data below); architecture should allow user-defined programs later.

### 7. Profile
- Avatar 54px circle + "SAM" 30px/800 + "RIDING SINCE MAY 2026" eyebrow.
- WEEKLY GOAL card (2px border): "34.9 / 60 KM" 34px/800 with muted denominator, right "58%" orange 16px/700; 10px progress track `#332E36` with orange fill.
- SETTINGS rows (2px `#241f27` rules): BIKE → "YESOUL S3-4F2A · CONNECTED" (orange); UNITS → KILOMETERS/MILES; EXPORT TO STRAVA → "COMING SOON".

### Navigation
Bottom tab bar on Home / Rides / Programs / Profile only: 4 equal labels HOME · RIDES · PROGRAMS · PROFILE, 14px/700/.15em, active = orange, inactive = muted; 2px `#241f27` top border. Connect, Live Ride, and Summary are full-screen modals outside the tabs.

## Interactions & Behavior
- Connect: scan starts on screen entry; device row appears when found; CONNECT → Home. Auto-reconnect to the last-known bike on later launches (skip this screen when it succeeds — prototype's `startScreen` tweak simulates this).
- Home → free ride (hero CTA) or program ride (cards). Avatar → Profile.
- Live ride ticks at 1Hz. Program rides auto-advance intervals by duration; when the last interval ends the ride finishes itself. END finishes at any time.
- Pause freezes time/distance/calorie accumulation; metrics stay on screen.
- Resistance +/− steps 1, clamped 1–32 (S3 range). Cue "▲n"/"▼n" shows delta to the interval target; resets when interval changes (resistance snaps to the new interval's target in the sim — with a real bike, read the broadcast value instead).
- Summary DONE prepends the ride to history and updates monthly/weekly aggregates.
- PB detection: ride distance > max distance in history.
- Button feedback: hover/pressed states listed per screen; press scale .98 on CONNECT.
- Numbers update in place — no layout shift (fixed min-widths on metric columns).

## State Management
- `screen`: connect | home | ride | summary | rides | programs | profile
- Connection: scanning → discovered → connected (+ device name); persist last device ID for auto-reconnect.
- Ride session: `program|null`, `elapsed`, `segIdx`, `segElapsed`, `paused`, `cadence`, `resistance`, `speed`, `distance`, `calories`, rolling avg-RPM accumulator.
- `summary`: {name, sec, km, kcal, avgRpm, pb} between ride end and DONE.
- `history`: array of {name, when, min, km, kcal}, newest first — **persist locally** (the prototype seeds 3 rides).
- Settings: `units` (km|mi; converts speed ×0.621, distance ×0.621, labels KM/H↔MPH, KM↔MI), weekly goal (60 km default).

## Bluetooth (real implementation notes)
The prototype **simulates** bike data. For the real S3, use the standard **FTMS** GATT service:
- Service `0x1826` (Fitness Machine); subscribe to **Indoor Bike Data** characteristic `0x2AD2` — flags-prefixed packet carrying instantaneous speed, cadence (note: FTMS cadence field is in 0.5 rpm units — divide by 2), resistance level, and often total distance/energy. Compute anything the bike omits (calories, distance) from speed/time as the sim does.
- Resistance control, if supported, via **Fitness Machine Control Point** `0x2AD9` (Set Target Resistance, after Request Control).
- Some Yesoul firmware only exposes cadence via CSC (`0x1816`) — probe FTMS first, fall back to CSC.
- Simulation model used by the prototype (useful for demo mode): cadence eases 30%/s toward target (85 free-ride) + ±4 jitter, clamped 50–115; speed km/h = cadence × (0.26 + resistance × 0.004); kcal/s = 0.16 × (cadence/85) × (resistance/10).

## Data (ship with these programs)
- HIIT 30 — "8 SPRINTS · HARD": WARM UP 300s @70–80 rpm res 8; 8 × (PUSH — SPRINT 60s @90–100 res 16, RECOVER 90s @70–80 res 10); COOL DOWN 300s @60–70 res 6.
- ENDURANCE 45 — "STEADY ZONE 2": WARM UP 180s @65–75 res 8; STEADY — ZONE 2 2340s @75–85 res 12; COOL DOWN 180s @60–70 res 6.
- PYRAMID 20 — "CLIMB UP, SPIN DOWN": WARM UP 120s @70–80 res 8; CLIMB 1 180s @80–90 res 12; CLIMB 2 180s @85–95 res 16; PEAK 120s @90–100 res 20; DESCEND 180s @80–90 res 14; SPIN OUT 180s @75–85 res 10; COOL DOWN 120s @60–70 res 6.

## Assets
- Font: Barlow Condensed (Google Fonts, weights 500/600/700/800) — the only asset. No icons (glyphs are text: ●, →, −, +, ★, ▲, ▼), no images.

## Files
- `Yesoul PULSE App.dc.html` — interactive prototype, primary reference (template markup + `Component` logic class near the bottom contain all copy, styles, and behavior)
- `Yesoul Spin App Mockups.dc.html` — earlier explorations (1a COCKPIT, 1b PULSE ✓ chosen, 1c ZONES)
- `ios-frame.jsx` — device chrome only, ignore for implementation
