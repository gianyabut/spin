jest.mock('@react-native-async-storage/async-storage', () => {
  const m: Record<string,string> = {};
  return { setItem: (k:string,v:string)=>{m[k]=v;return Promise.resolve();},
           getItem: (k:string)=>Promise.resolve(m[k] ?? null) };
});
import { loadSettings, saveSettings, saveHistory, loadHistory } from '../src/persistence/repository';
test('round-trips settings with defaults', async () => {
  expect((await loadSettings()).units).toBe('km');
  await saveSettings({ units:'mi', weeklyGoalKm:60, lastDeviceId:'abc' });
  expect((await loadSettings()).lastDeviceId).toBe('abc');
});
test('round-trips history', async () => {
  await saveHistory([{ id:'1', name:'X', when:'TODAY', min:20, km:9, kcal:200, date:'2026-08-29' }]);
  expect((await loadHistory())![0].km).toBe(9);
});
