export const FTMS = {
  service: '00001826-0000-1000-8000-00805f9b34fb',
  indoorBikeData: '00002ad2-0000-1000-8000-00805f9b34fb',
  controlPoint: '00002ad9-0000-1000-8000-00805f9b34fb',
} as const;
export const CSC = {
  service: '00001816-0000-1000-8000-00805f9b34fb',
  measurement: '00002a5b-0000-1000-8000-00805f9b34fb',
} as const;
export const CP_OPCODE = { requestControl: 0x00, setTargetResistance: 0x04 } as const;
