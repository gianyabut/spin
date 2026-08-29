import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import type { BikeSource, BikeReading, ConnState, DiscoveredDevice, Unsubscribe } from './BikeSource';
import { FTMS } from './constants';
import { parseIndoorBikeData } from './ftmsParser';
import { requestControl, setTargetResistance } from './ftmsControl';

const b64ToBytes = (b64: string) => Array.from(Buffer.from(b64, 'base64'));
const bytesToB64 = (bytes: number[]) => Buffer.from(bytes).toString('base64');

export class FtmsBikeSource implements BikeSource {
  capabilities = { control: false };
  private mgr = new BleManager();
  private device: Device | null = null;
  private state: ConnState = 'idle';
  private dataCbs = new Set<(r: BikeReading) => void>();
  private stateCbs = new Set<(s: ConnState) => void>();
  private notifySub: Subscription | null = null;

  getState() { return this.state; }
  private set(s: ConnState) { this.state = s; this.stateCbs.forEach(cb => cb(s)); }
  onData(cb: (r: BikeReading) => void) { this.dataCbs.add(cb); return () => this.dataCbs.delete(cb); }
  onState(cb: (s: ConnState) => void) { this.stateCbs.add(cb); return () => this.stateCbs.delete(cb); }

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
    try {
      this.mgr.stopDeviceScan();
      const dev = await this.mgr.connectToDevice(deviceId);
      await dev.discoverAllServicesAndCharacteristics();
      this.device = dev;
      // Try to enable control (optional; failure is non-fatal).
      try {
        await dev.writeCharacteristicWithResponseForService(
          FTMS.service, FTMS.controlPoint, bytesToB64(requestControl()));
        this.capabilities = { control: true };
      } catch { this.capabilities = { control: false }; }
      this.notifySub = dev.monitorCharacteristicForService(
        FTMS.service, FTMS.indoorBikeData, (err, ch) => {
          if (err || !ch?.value) return;
          this.dataCbs.forEach(cb => cb(parseIndoorBikeData(b64ToBytes(ch.value!))));
        });
      dev.onDisconnected(() => this.set('idle'));
      this.set('connected');
    } catch { this.set('error'); throw new Error('connect failed'); }
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
