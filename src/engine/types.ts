export type Units = 'km' | 'mi';
// `res` is the app's 1–32 intensity model (drives the sim + the Programs intensity
// strip). `resTarget` is the target on the BIKE's own 0–100 resistance scale (the
// Yesoul S3 broadcasts 0–100), used by the Live Ride "lower/raise to N" cue so it
// compares like-for-like against the live value read from the bike.
export type Segment = { label: string; dur: number; lo: number; hi: number; res: number; resTarget?: number };
export type Program = { id: string; name: string; desc: string; segs: Segment[] };
export type Session = {
  program: Program | null; elapsed: number; segIdx: number; segElapsed: number; paused: boolean;
  cadence: number; resistance: number; speedKmh: number; distanceKm: number; calories: number;
  power: number; rpmSum: number; rpmN: number;
};
export type Summary = { name: string; sec: number; km: number; kcal: number; avgRpm: number; pb: boolean; prevBestKm?: number };
export type Ride = { id: string; name: string; when: string; min: number; km: number; kcal: number; date: string };
export type Settings = { units: Units; weeklyGoalKm: number; lastDeviceId: string | null };
