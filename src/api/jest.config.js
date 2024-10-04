/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  // Specify the Jest preset for TypeScript
  preset: 'ts-jest',

  // Set the test environment to Node.js
  testEnvironment: 'node',

  // Define the root directories for tests
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Specify the test file patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],

  // Configure TypeScript transformation
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },

  // Set up module name mapping for cleaner imports
  moduleNameMapper: {
    '@shared/(.*)': '<rootDir>/../shared/$1',
    '@/(.*)': '<rootDir>/src/$1'
  },

  // Configure coverage directory and reporters
  coverageDirectory: 'coverage',
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

  // Configure global settings for ts-jest
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },

  // Verbose output for detailed test results
  verbose: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/app.ts'
  ],

  // The maximum amount of workers used to run your tests
  maxWorkers: '50%',

  // An array of directory names to be searched recursively up from the requiring module's location
  moduleDirectories: ['node_modules', 'src'],

  // A list of paths to directories that Jest should use to search for files in
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // The test environment that will be used for testing
  testEnvironment: 'node',

  // The glob patterns Jest uses to detect test files
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: ['/node_modules/'],

  // This option sets the URL for the jsdom environment. It is reflected in properties such as location.href
  testURL: 'http://localhost',

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: ['/node_modules/', '\\.pnp\\.[^\\/]+$'],

  // Indicates whether each individual test should be reported during the run
  verbose: true,
};