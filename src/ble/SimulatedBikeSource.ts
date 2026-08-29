import type { BikeSource, BikeReading, ConnState, DiscoveredDevice, Unsubscribe } from './BikeSource';

export class SimulatedBikeSource implements BikeSource {
  readonly capabilities = { control: true };
  private state: ConnState = 'idle';
  private cad = 62; private target = 85; private res = 8;
  private dataCbs = new Set<(r: BikeReading) => void>();
  private stateCbs = new Set<(s: ConnState) => void>();
  private timer: any = null;
  private tickMs = process.env.NODE_ENV === 'test' ? 30 : 1000;

  getState() { return this.state; }
  private set(s: ConnState) { this.state = s; this.stateCbs.forEach(cb => cb(s)); }

  scan(onDevice: (d: DiscoveredDevice) => void): Unsubscribe {
    this.set('scanning');
    const t = setTimeout(() => onDevice({ id: 'sim', name: 'YESOUL S3-4F2A', rssi: -55 }), 10);
    return () => clearTimeout(t);
  }
  async connect(_id: string) {
    this.set('connecting'); this.set('connected');
    this.timer = setInterval(() => this.step(), this.tickMs);
  }
  async disconnect() { if (this.timer) clearInterval(this.timer); this.timer = null; this.set('idle'); }
  onData(cb: (r: BikeReading) => void) { this.dataCbs.add(cb); return () => this.dataCbs.delete(cb); }
  onState(cb: (s: ConnState) => void) { this.stateCbs.add(cb); return () => this.stateCbs.delete(cb); }
  async setResistance(level: number) { this.res = Math.max(1, Math.min(32, level)); }
  setTarget(rpm: number) { this.target = rpm; }

  private step() {
    this.cad += (this.target - this.cad) * 0.3 + (Math.random() * 8 - 4);
    this.cad = Math.max(50, Math.min(115, this.cad));
    this.dataCbs.forEach(cb => cb({ cadence: this.cad, resistance: this.res, ts: Date.now() }));
  }
}
