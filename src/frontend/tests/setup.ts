import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import 'jest-environment-jsdom';

// Configure testing-library
configure({ testIdAttribute: 'data-testid' });

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Setup global mocks
global.ResizeObserver = ResizeObserverMock;
global.IntersectionObserver = IntersectionObserverMock;

// Setup fetch polyfill for network request testing
global.fetch = jest.fn();

// Setup global error handler for testing scenarios
global.console.error = jest.fn();

/**
 * Sets up global mock objects and functions required for the testing environment
 */
function setupGlobalMocks(): void {
  // Define mock implementations for ResizeObserver
  global.ResizeObserver = ResizeObserverMock;

  // Define mock implementations for IntersectionObserver
  global.IntersectionObserver = IntersectionObserverMock;

  // Set up any other required global mocks
  jest.spyOn(console, 'error').mockImplementation(() => {});
}

/**
 * Configures the overall test environment, including DOM-specific settings and global variables
 */
function setupTestEnvironment(): void {
  // Set up environment variables for testing
  process.env.REACT_APP_API_URL = 'http://localhost:3000/api';

  // Extend Jest with custom DOM element matchers
  expect.extend({
    toHaveStyleRule(received, property, value) {
      const style = window.getComputedStyle(received);
      const pass = style[property] === value;
      if (pass) {
        return {
          message: () =>
            `expected ${received} not to have CSS property "${property}" with value "${value}"`,
          pass: true,
        };
      } else {
        return {
          message: () =>
            `expected ${received} to have CSS property "${property}" with value "${value}"`,
          pass: false,
        };
      }
    },
  });

  // Configure fetch polyfill for network request testing
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
    })
  ) as jest.Mock;

  // Set up cleanup utilities for test isolation
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Configure error handlers for testing scenarios
  jest.spyOn(console, 'error').mockImplementation(() => {});
}

// Run setup functions
setupGlobalMocks();
setupTestEnvironment();

// Export setup functions for potential use in individual test files
export { setupGlobalMocks, setupTestEnvironment };