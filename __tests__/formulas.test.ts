import { deriveSpeedKmh, deriveKcalPerSec, convDist, distLabel, speedLabel } from '../src/engine/formulas';
test('speed from cadence and resistance', () => {
  expect(deriveSpeedKmh(90, 16)).toBeCloseTo(90 * (0.26 + 16 * 0.004), 5); // 29.16
});
test('kcal per second uses max(res,4)', () => {
  expect(deriveKcalPerSec(85, 2)).toBeCloseTo(0.16 * 1 * (4 / 10), 5); // res floored to 4
});
test('resistance is capped at 32 for wide-scale bikes (e.g. Yesoul 0–100)', () => {
  // res 84 must not inflate past the res-32 result.
  expect(deriveKcalPerSec(85, 84)).toBeCloseTo(0.16 * 1 * (32 / 10), 5);
  expect(deriveSpeedKmh(90, 84)).toBeCloseTo(90 * (0.26 + 32 * 0.004), 5);
});
test('mi conversion and labels', () => {
  expect(convDist(10, 'mi')).toBeCloseTo(6.21, 2);
  expect(convDist(10, 'km')).toBe(10);
  expect(distLabel('mi')).toBe('MI'); expect(speedLabel('mi')).toBe('MPH');
});
