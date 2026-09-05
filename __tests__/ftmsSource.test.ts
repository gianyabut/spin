// Drive FtmsBikeSource against a fully mocked react-native-ble-plx (no native
// module, no device). Exercises scan, connect (control on/off), the FTMS +
// Yesoul-fff4 notify merge, disconnect, setResistance and the error path.
jest.mock('react-native-ble-plx', () => {
  const monitors: Record<string, (e: any, c: any) => void> = {};
  const flags = { connectRejects: false, controlRejects: false };
  const device = {
    id: 'dev1',
    discoverAllServicesAndCharacteristics: jest.fn(() => Promise.resolve()),
    writeCharacteristicWithResponseForService: jest.fn(() =>
      flags.controlRejects ? Promise.reject(new Error('no control')) : Promise.resolve()),
    monitorCharacteristicForService: jest.fn((_s: string, ch: string, cb: any) => { monitors[ch] = cb; return { remove: jest.fn() }; }),
    onDisconnected: jest.fn(),
  };
  const mgr = {
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    connectToDevice: jest.fn(() =>
      flags.connectRejects
        ? Promise.reject(Object.assign(new Error('boom'), { reason: 'r', errorCode: 1, iosErrorCode: 2, attErrorCode: 3 }))
        : Promise.resolve(device)),
    cancelDeviceConnection: jest.fn(() => Promise.resolve()),
  };
  return { BleManager: jest.fn(() => mgr), __mgr: mgr, __device: device, __monitors: monitors, __flags: flags };
});

import { Buffer } from 'buffer';
import { FtmsBikeSource } from '../src/ble/FtmsBikeSource';
import { FTMS } from '../src/ble/constants';

const ble: any = require('react-native-ble-plx');
const YESOUL_DATA = '0000fff4-0000-1000-8000-00805f9b34fb';
const b64 = (bytes: number[]) => Buffer.from(bytes).toString('base64');

beforeEach(() => {
  ble.__flags.connectRejects = false;
  ble.__flags.controlRejects = false;
  Object.keys(ble.__monitors).forEach(k => delete ble.__monitors[k]);
  jest.clearAllMocks();
});

test('scan forwards discovered devices and stops on unsubscribe', () => {
  const src = new FtmsBikeSource();
  const seen: any[] = [];
  const stop = src.scan(d => seen.push(d));
  expect(src.getState()).toBe('scanning');
  const cb = ble.__mgr.startDeviceScan.mock.calls[0][2];
  cb(null, { id: 'x', name: 'YESOUL S3', rssi: -40 });
  cb('err', null);                    // error → ignored
  cb(null, { id: 'y', name: null, localName: null, rssi: -50 }); // name fallback
  expect(seen).toEqual([
    { id: 'x', name: 'YESOUL S3', rssi: -40 },
    { id: 'y', name: 'SMART BIKE', rssi: -50 },
  ]);
  stop();
  expect(ble.__mgr.stopDeviceScan).toHaveBeenCalled();
});

test('connect subscribes, gains control, and merges FTMS + fff4 readings', async () => {
  const src = new FtmsBikeSource();
  const readings: any[] = [];
  const states: string[] = [];
  src.onData(r => readings.push(r));
  const off = src.onState(s => states.push(s));

  await src.connect('dev1');
  expect(src.getState()).toBe('connected');
  expect(src.capabilities.control).toBe(true);
  expect(states).toContain('connecting');
  expect(states).toContain('connected');

  // fff4 first (no FTMS power yet) → cadence/resistance/power from proprietary bytes
  ble.__monitors[YESOUL_DATA](null, null);                    // no value → ignored
  ble.__monitors[YESOUL_DATA](null, { value: b64([0, 0, 0, 0, 12, 0, 88, 0, 100, 0]) });
  let last = readings[readings.length - 1];
  expect(last.cadence).toBe(88);
  expect(last.resistance).toBe(12);
  expect(last.power).toBe(100);

  // FTMS packet: flags 0x0150 → speed + distance + power + energy
  const ftms = [0x50, 0x01, 0xB8, 0x0B, 0x88, 0x13, 0x00, 0x96, 0x00, 0xC8, 0x00, 0, 0, 0];
  ble.__monitors[FTMS.indoorBikeData]('err', null);           // error → ignored
  ble.__monitors[FTMS.indoorBikeData](null, { value: b64(ftms) });
  last = readings[readings.length - 1];
  expect(last.speedKmh).toBeCloseTo(30);
  expect(last.distanceKm).toBeCloseTo(5);
  expect(last.power).toBe(150);       // FTMS power now preferred
  expect(last.calories).toBe(200);

  // onDisconnected handler flips state to idle
  ble.__device.onDisconnected.mock.calls[0][0]();
  expect(src.getState()).toBe('idle');
  off();
});

test('connect tolerates a bike without resistance control', async () => {
  ble.__flags.controlRejects = true;
  const src = new FtmsBikeSource();
  await src.connect('dev1');
  expect(src.getState()).toBe('connected');
  expect(src.capabilities.control).toBe(false);
  // setResistance is a no-op without control
  await src.setResistance(10);
  // only the (failed) requestControl write was attempted, none for setResistance
  expect(ble.__device.writeCharacteristicWithResponseForService).toHaveBeenCalledTimes(1);
});

test('setResistance writes to the control point when control is available', async () => {
  const src = new FtmsBikeSource();
  await src.connect('dev1');
  ble.__device.writeCharacteristicWithResponseForService.mockClear();
  await src.setResistance(16);
  expect(ble.__device.writeCharacteristicWithResponseForService).toHaveBeenCalledWith(
    FTMS.service, FTMS.controlPoint, expect.any(String),
  );
});

test('connect surfaces a diagnostic error and enters the error state', async () => {
  ble.__flags.connectRejects = true;
  const src = new FtmsBikeSource();
  await expect(src.connect('dev1')).rejects.toThrow(/\[connectToDevice\].*boom.*reason=r.*code=1.*ios=2.*att=3/);
  expect(src.getState()).toBe('error');
  expect(src.lastError).toMatch(/connectToDevice/);
});

test('disconnect removes the notify sub and cancels the connection', async () => {
  const src = new FtmsBikeSource();
  await src.connect('dev1');
  await src.disconnect();
  expect(ble.__mgr.cancelDeviceConnection).toHaveBeenCalledWith('dev1');
  expect(src.getState()).toBe('idle');
});
