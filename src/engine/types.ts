export type Units = 'km' | 'mi';
export type Segment = { label: string; dur: number; lo: number; hi: number; res: number };
export type Program = { id: string; name: string; desc: string; segs: Segment[] };
export type Session = {
  program: Program | null; elapsed: number; segIdx: number; segElapsed: number; paused: boolean;
  cadence: number; resistance: number; speedKmh: number; distanceKm: number; calories: number;
  power: number; rpmSum: number; rpmN: number;
};
export type Summary = { name: string; sec: number; km: number; kcal: number; avgRpm: number; pb: boolean };
export type Ride = { id: string; name: string; when: string; min: number; km: number; kcal: number; date: string };
export type Settings = { units: Units; weeklyGoalKm: number; lastDeviceId: string | null };
