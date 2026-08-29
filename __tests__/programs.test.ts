import { PROGRAMS, totalDur } from '../src/engine/programs';
test('ships exactly 3 programs', () => { expect(PROGRAMS.map(p => p.name)).toEqual(['HIIT 30','ENDURANCE 45','PYRAMID 20']); });
test('HIIT 30 has warmup + 8×(sprint,recover) + cooldown = 18 segments', () => {
  const hiit = PROGRAMS[0]; expect(hiit.segs.length).toBe(18);
  expect(hiit.segs[1]).toEqual({ label: 'PUSH — SPRINT', dur: 60, lo: 90, hi: 100, res: 16 });
});
test('HIIT 30 total is 30 minutes', () => { expect(totalDur(PROGRAMS[0])).toBe(30 * 60); });
