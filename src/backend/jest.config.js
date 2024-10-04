/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Specify the test environment
  testEnvironment: 'node',

  // Use ts-jest for TypeScript preprocessing
  preset: 'ts-jest',

  // Define the root directories for tests and source files
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Specify test file patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],

  // Configure path aliases for cleaner imports
  moduleNameMapper: {
    '@shared': '<rootDir>/../shared/$1',
    '@': '<rootDir>/src/$1'
  },

  // Set up the coverage directory
  coverageDirectory: 'coverage',

  // Specify coverage report formats
  coverageReporters: ['text', 'lcov'],

  // Set coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Specify setup files to run after Jest is initialized
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Ignore specific directories from code coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/',
    '/dist/'
  ],

  // Transform non-TypeScript files
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Global variables available in all test files
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },

  // Verbose output for test results
  verbose: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts'
  ],

  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ['json', 'lcov', 'text', 'clover'],

  // An object that configures minimum threshold enforcement for coverage results
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Automatically reset mock state between every test
  resetMocks: true,

  // Automatically restore mock state between every test
  restoreMocks: true,

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // Options that will be passed to the testEnvironment
  testEnvironmentOptions: {},

  // A map from regular expressions to paths to transformers
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};