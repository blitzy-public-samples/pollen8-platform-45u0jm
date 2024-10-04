/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Preset for TypeScript testing
  preset: 'ts-jest',

  // Set the test environment to Node.js
  testEnvironment: 'node',

  // Define the root directory for tests
  roots: ['<rootDir>/tests'],

  // Regular expression pattern for test files
  testRegex: '.test.ts$',

  // File extensions Jest will look for
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Directory for code coverage reports
  coverageDirectory: 'coverage',

  // Specify which files to collect coverage from
  collectCoverageFrom: ['src/**/*.ts'],

  // Set coverage thresholds to ensure code quality
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Transform TypeScript files using ts-jest
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Module name mapper for easier imports
  moduleNameMapper: {
    '@socket/(.*)': '<rootDir>/src/$1',
  },

  // Setup files to run after Jest is initialized
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Reporters for test results
  reporters: ['default', 'jest-junit'],

  // Set a timeout for tests (in milliseconds)
  testTimeout: 10000,

  // Additional options can be added here as needed
};

// This configuration addresses the following requirements:
// - Test Environment Setup: Configures Jest for TypeScript testing in the socket service
// - Code Quality: Ensures comprehensive test coverage for WebSocket functionality