const path = require('path');

module.exports = {
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  rootDir: path.resolve(__dirname),
  setupFiles: [
    '<rootDir>/tests/setup.ts',
  ],
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'],
  testRunner: 'jest-circus/runner',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true
}
