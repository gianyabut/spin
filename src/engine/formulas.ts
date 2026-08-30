import type { Units } from './types';
// Some bikes report resistance on a wider scale than the app's 1–32 model
// (e.g. the Yesoul S3 reports 0–100), so clamp to 32 before deriving speed /
// calories to keep estimates sane. No-op for 1–32 sources.
const RES_CAP = 32;
export const deriveSpeedKmh = (cad: number, res: number) => cad * (0.26 + Math.min(res, RES_CAP) * 0.004);
export const deriveKcalPerSec = (cad: number, res: number) =>
  0.16 * (cad / 85) * (Math.min(Math.max(res, 4), RES_CAP) / 10);
export const convDist = (km: number, u: Units) => (u === 'mi' ? km * 0.621 : km);
export const convSpeed = (kmh: number, u: Units) => (u === 'mi' ? kmh * 0.621 : kmh);
export const distLabel = (u: Units) => (u === 'mi' ? 'MI' : 'KM');
export const speedLabel = (u: Units) => (u === 'mi' ? 'MPH' : 'KM/H');
