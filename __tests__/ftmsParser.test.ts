import { parseIndoorBikeData } from '../src/ble/ftmsParser';

// flags=0x0040 → bit0=0 (speed present), bit6=1 (instantaneous power). LE.
// speed=0 ; power=150 (0x0096) watts
test('parses instantaneous power (bit6)', () => {
  const bytes = [0x40, 0x00, 0x00, 0x00, 0x96, 0x00];
  const r = parseIndoorBikeData(bytes);
  expect(r.power).toBe(150);
});

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
