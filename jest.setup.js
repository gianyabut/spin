// Silence native module warnings in unit tests; BLE is never imported in pure tests.
jest.mock('react-native-ble-plx', () => ({ BleManager: jest.fn() }), { virtual: true });
