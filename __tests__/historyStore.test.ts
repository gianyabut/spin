jest.mock('@react-native-async-storage/async-storage', () => ({ setItem: ()=>Promise.resolve(), getItem: ()=>Promise.resolve(null) }));
import { useHistory } from '../src/store/historyStore';
test('addRide prepends and updates maxKm', async () => {
  await useHistory.getState().hydrate(); // seeds 3
  useHistory.getState().addRide({ id:'n', name:'HIIT 30', when:'TODAY', min:22, km:20, kcal:300, date:'2026-08-29' });
  expect(useHistory.getState().rides[0].id).toBe('n');
  expect(useHistory.getState().maxKm()).toBe(20);
});
