import type { Program, Ride, Segment } from './types';
// resTarget = target resistance on the bike's 0–100 scale (Yesoul S3), calibrated
// from the rider's feel: easy ≈ 50, steady ≈ 60, sprint ≈ 70.
const hiit: Segment[] = [{ label: 'WARM UP', dur: 300, lo: 70, hi: 80, res: 8, resTarget: 50 }];
for (let i = 0; i < 8; i++) {
  hiit.push({ label: 'PUSH — SPRINT', dur: 60, lo: 90, hi: 100, res: 16, resTarget: 70 });
  hiit.push({ label: 'RECOVER', dur: 90, lo: 70, hi: 80, res: 10, resTarget: 50 });
}
hiit.push({ label: 'COOL DOWN', dur: 300, lo: 60, hi: 70, res: 6, resTarget: 50 });

export const PROGRAMS: Program[] = [
  { id: 'hiit30', name: 'HIIT 30', desc: '8 SPRINTS · HARD', segs: hiit },
  { id: 'end45', name: 'ENDURANCE 45', desc: 'STEADY ZONE 2', segs: [
    { label: 'WARM UP', dur: 180, lo: 65, hi: 75, res: 8, resTarget: 50 },
    { label: 'STEADY — ZONE 2', dur: 2340, lo: 75, hi: 85, res: 12, resTarget: 60 },
    { label: 'COOL DOWN', dur: 180, lo: 60, hi: 70, res: 6, resTarget: 50 } ] },
  { id: 'pyr20', name: 'PYRAMID 20', desc: 'CLIMB UP, SPIN DOWN', segs: [
    { label: 'WARM UP', dur: 120, lo: 70, hi: 80, res: 8, resTarget: 50 },
    { label: 'CLIMB 1', dur: 180, lo: 80, hi: 90, res: 12, resTarget: 60 },
    { label: 'CLIMB 2', dur: 180, lo: 85, hi: 95, res: 16, resTarget: 65 },
    { label: 'PEAK', dur: 120, lo: 90, hi: 100, res: 20, resTarget: 70 },
    { label: 'DESCEND', dur: 180, lo: 80, hi: 90, res: 14, resTarget: 60 },
    { label: 'SPIN OUT', dur: 180, lo: 75, hi: 85, res: 10, resTarget: 55 },
    { label: 'COOL DOWN', dur: 120, lo: 60, hi: 70, res: 6, resTarget: 50 } ] },
];
export const totalDur = (p: Program) => p.segs.reduce((a, g) => a + g.dur, 0);
export const SEED_HISTORY: Ride[] = [
  { id: 's1', name: 'HIIT 30', when: 'THU', min: 30, km: 11.2, kcal: 341, date: '2026-08-27' },
  { id: 's2', name: 'Free ride', when: 'WED', min: 41, km: 14.8, kcal: 402, date: '2026-08-26' },
  { id: 's3', name: 'Endurance 45', when: 'MON', min: 45, km: 16.1, kcal: 458, date: '2026-08-24' },
];
