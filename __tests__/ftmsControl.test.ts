import { requestControl, setTargetResistance } from '../src/ble/ftmsControl';
test('requestControl is opcode 0x00', () => { expect(requestControl()).toEqual([0x00]); });
test('setTargetResistance packs opcode + level byte', () => {
  expect(setTargetResistance(16)).toEqual([0x04, 16]);
});
test('setTargetResistance clamps to 1..32', () => {
  expect(setTargetResistance(99)).toEqual([0x04, 32]);
  expect(setTargetResistance(0)).toEqual([0x04, 1]);
});
