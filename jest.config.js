module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', '<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|react-native-ble-plx|react-native-svg|zustand))',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/engine/types.ts',      // type declarations only — no executable code
    '!src/ble/BikeSource.ts',    // interface + type declarations only
  ],
  coverageThreshold: {
    global: { statements: 90, lines: 90, functions: 90, branches: 82 },
  },
};
