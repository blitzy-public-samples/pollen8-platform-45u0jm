/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Specify the test environment as jsdom for DOM simulation
  testEnvironment: 'jsdom',

  // Configure global test setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Define root directories for test discovery
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Specify module directories
  moduleDirectories: ['node_modules', 'src'],

  // Configure module name mapping for aliases and file type handling
  moduleNameMapper: {
    // Handle CSS imports (including CSS modules)
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    // Align module resolution with TypeScript configuration
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Specify file extensions to be processed
  moduleFileExtensions: ['.ts', '.tsx', '.js', '.jsx'],

  // Define test file discovery patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],

  // Configure coverage collection
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/vite-env.d.ts'
  ],

  // Define coverage report formats
  coverageReporters: ['text', 'lcov'],

  // Set minimum coverage requirements
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Configure file transformations for testing
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },

  // Specify files to exclude from transformation
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$'
  ],

  // Additional Jest configuration options
  verbose: true,
  testTimeout: 30000,
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json'
    }
  }
};