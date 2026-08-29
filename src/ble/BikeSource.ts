export type BikeReading = {
  cadence: number;         // rpm (already /2 from FTMS units)
  speedKmh?: number;
  resistance?: number;
  distanceKm?: number;     // cumulative if broadcast
  calories?: number;       // cumulative if broadcast
  power?: number;
  ts: number;
};
export type DiscoveredDevice = { id: string; name: string; rssi: number | null };
export type ConnState = 'idle' | 'scanning' | 'connecting' | 'connected' | 'error';
export type Unsubscribe = () => void;

export interface BikeSource {
  readonly capabilities: { control: boolean };
  getState(): ConnState;
  scan(onDevice: (d: DiscoveredDevice) => void): Unsubscribe;
  connect(deviceId: string): Promise<void>;
  disconnect(): Promise<void>;
  onData(cb: (r: BikeReading) => void): Unsubscribe;
  onState(cb: (s: ConnState) => void): Unsubscribe;
  setResistance?(level: number): Promise<void>;
}
