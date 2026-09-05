import { parseIndoorBikeData } from '../src/ble/ftmsParser';

// A maximal FTMS Indoor Bike Data packet exercising the optional fields and the
// signed decode (negative resistance/power) plus the skipped average groups.
test('parses a full packet with averages skipped and signed resistance/power', () => {
  const bytes = [
    0xFE, 0x01,       // flags 0x01FE: speed present + avg-speed, cadence, avg-cadence, distance, resistance, power, avg-power, energy
    0xE8, 0x03,       // instantaneous speed 1000 → 10.00 km/h
    0x00, 0x00,       // average speed (skipped)
    0xB4, 0x00,       // instantaneous cadence 180 → 90 rpm
    0x00, 0x00,       // average cadence (skipped)
    0xD0, 0x07, 0x00, // total distance 2000 m → 2.0 km
    0xFB, 0xFF,       // resistance -5 (signed)
    0xF6, 0xFF,       // power -10 W (signed)
    0x00, 0x00,       // average power (skipped)
    0x32, 0x00, 0x00, 0x00, 0x00, // energy: total 50 kcal + per-hour + per-min
  ];
  const r = parseIndoorBikeData(bytes);
  expect(r.speedKmh).toBeCloseTo(10);
  expect(r.cadence).toBe(90);
  expect(r.distanceKm).toBeCloseTo(2);
  expect(r.resistance).toBe(-5);
  expect(r.power).toBe(-10);
  expect(r.calories).toBe(50);
});

test('accepts a Uint8Array and reads speed-only when no optional flags are set', () => {
  const r = parseIndoorBikeData(Uint8Array.from([0x00, 0x00, 0xB8, 0x0B])); // flags 0 → speed 3000 → 30 km/h
  expect(r.speedKmh).toBeCloseTo(30);
  expect(r.cadence).toBe(0);
  expect(r.power).toBeUndefined();
});
