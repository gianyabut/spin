import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import type { BikeSource, BikeReading, ConnState, DiscoveredDevice, Unsubscribe } from './BikeSource';
import { FTMS } from './constants';
import { parseIndoorBikeData } from './ftmsParser';
import { requestControl, setTargetResistance } from './ftmsControl';

const b64ToBytes = (b64: string) => Array.from(Buffer.from(b64, 'base64'));
const bytesToB64 = (bytes: number[]) => Buffer.from(bytes).toString('base64');
const uuid = (short: string) => `0000${short}-0000-1000-8000-00805f9b34fb`;

// Yesoul proprietary telemetry service. The S3 splits its data: FTMS Indoor
// Bike Data (0x2AD2) carries instantaneous SPEED only, while cadence and
// resistance are broadcast here — validated on-device against a real S3:
//   fff4 byte[6] = cadence (RPM), byte[4] = resistance level.
const YESOUL_SERVICE = uuid('fff0');
const YESOUL_DATA = uuid('fff4');

export class FtmsBikeSource implements BikeSource {
  capabilities = { control: false };
  private mgr = new BleManager();
  private device: Device | null = null;
  private state: ConnState = 'idle';
  private dataCbs = new Set<(r: BikeReading) => void>();
  private stateCbs = new Set<(s: ConnState) => void>();
  private notifySub: Subscription | null = null;
  // Last connection failure, human-readable — surfaced by the Connect screen.
  lastError: string | null = null;
  // The S3 splits telemetry across two characteristics (FTMS = speed,
  // fff0/fff4 = cadence + resistance), so we accumulate both into one reading.
  private latest: BikeReading = { cadence: 0, ts: 0 };

  getState() { return this.state; }
  private set(s: ConnState) { this.state = s; this.stateCbs.forEach(cb => cb(s)); }
  onData(cb: (r: BikeReading) => void) { this.dataCbs.add(cb); return () => this.dataCbs.delete(cb); }
  onState(cb: (s: ConnState) => void) { this.stateCbs.add(cb); return () => this.stateCbs.delete(cb); }
  private emit(patch: Partial<BikeReading>) {
    this.latest = { ...this.latest, ...patch, ts: Date.now() };
    this.dataCbs.forEach(cb => cb(this.latest));
  }

  scan(onDevice: (d: DiscoveredDevice) => void): Unsubscribe {
    this.set('scanning');
    this.mgr.startDeviceScan([FTMS.service], null, (err, dev) => {
      if (err || !dev) return;
      onDevice({ id: dev.id, name: dev.name ?? dev.localName ?? 'SMART BIKE', rssi: dev.rssi });
    });
    return () => this.mgr.stopDeviceScan();
  }

  async connect(deviceId: string) {
    this.set('connecting');
    this.lastError = null;
    let step = 'start';
    try {
      this.mgr.stopDeviceScan();
      step = 'connectToDevice';
      const dev = await this.mgr.connectToDevice(deviceId, { timeout: 15000 });
      step = 'discoverServices';
      await dev.discoverAllServicesAndCharacteristics();
      this.device = dev;
      // Try to enable resistance control (optional; non-fatal on failure).
      step = 'requestControl';
      try {
        await dev.writeCharacteristicWithResponseForService(
          FTMS.service, FTMS.controlPoint, bytesToB64(requestControl()));
        this.capabilities = { control: true };
      } catch { this.capabilities = { control: false }; }
      step = 'monitor';
      // FTMS Indoor Bike Data (0x2AD2) on the S3 carries instantaneous SPEED
      // (+ any distance/energy) but NOT cadence — merge those fields, leaving
      // cadence + resistance to the Yesoul fff4 stream below.
      this.notifySub = dev.monitorCharacteristicForService(
        FTMS.service, FTMS.indoorBikeData, (err, ch) => {
          if (err || !ch?.value) return;
          const r = parseIndoorBikeData(b64ToBytes(ch.value));
          const patch: Partial<BikeReading> = {};
          if (r.speedKmh !== undefined) patch.speedKmh = r.speedKmh;
          if (r.distanceKm !== undefined) patch.distanceKm = r.distanceKm;
          if (r.calories !== undefined) patch.calories = r.calories;
          this.emit(patch);
        });
      // Cadence (RPM) = fff4 byte[6], resistance level = fff4 byte[4].
      dev.monitorCharacteristicForService(YESOUL_SERVICE, YESOUL_DATA, (err, ch) => {
        if (err || !ch?.value) return;
        const bytes = b64ToBytes(ch.value);
        if (bytes.length > 6) this.emit({ cadence: bytes[6], resistance: bytes[4] });
      });
      dev.onDisconnected(() => this.set('idle'));
      this.set('connected');
    } catch (e: any) {
      // Preserve the underlying ble-plx error (step + reason + iOS codes) so
      // connection failures are diagnosable from the Connect screen.
      const parts = [
        `[${step}]`,
        e?.message,
        e?.reason && `reason=${e.reason}`,
        e?.errorCode != null && `code=${e.errorCode}`,
        e?.iosErrorCode != null && `ios=${e.iosErrorCode}`,
        e?.attErrorCode != null && `att=${e.attErrorCode}`,
      ].filter(Boolean);
      this.lastError = parts.join(' ');
      this.set('error');
      throw new Error(this.lastError);
    }
  }

  async disconnect() {
    this.notifySub?.remove(); this.notifySub = null;
    if (this.device) await this.mgr.cancelDeviceConnection(this.device.id).catch(() => {});
    this.device = null; this.set('idle');
  }

  async setResistance(level: number) {
    if (!this.device || !this.capabilities.control) return;
    await this.device.writeCharacteristicWithResponseForService(
      FTMS.service, FTMS.controlPoint, bytesToB64(setTargetResistance(level)));
  }
}
