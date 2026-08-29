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
