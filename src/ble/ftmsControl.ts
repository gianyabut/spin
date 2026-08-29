import { CP_OPCODE } from './constants';
export const requestControl = (): number[] => [CP_OPCODE.requestControl];
export const setTargetResistance = (level: number): number[] =>
  [CP_OPCODE.setTargetResistance, Math.max(1, Math.min(32, Math.round(level)))];
