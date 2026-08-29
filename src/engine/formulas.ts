import type { Units } from './types';
export const deriveSpeedKmh = (cad: number, res: number) => cad * (0.26 + res * 0.004);
export const deriveKcalPerSec = (cad: number, res: number) => 0.16 * (cad / 85) * (Math.max(res, 4) / 10);
export const convDist = (km: number, u: Units) => (u === 'mi' ? km * 0.621 : km);
export const convSpeed = (kmh: number, u: Units) => (u === 'mi' ? kmh * 0.621 : kmh);
export const distLabel = (u: Units) => (u === 'mi' ? 'MI' : 'KM');
export const speedLabel = (u: Units) => (u === 'mi' ? 'MPH' : 'KM/H');
