/**
 * index.ts
 * 
 * This file serves as a centralized export point for all constants used in the Pollen8 platform.
 * It aggregates and re-exports constants from various modules to provide a single source of truth
 * for constant values across the application.
 * 
 * Requirements addressed:
 * - Industry Focus (Technical Specification/1.1 System Objectives): Centralize industry constants
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives): Centralize network value constants
 * - User-Centric Design (Technical Specification/1.1 System Objectives): Centralize error codes and messages
 */

// Re-export all constants from the industries module
export * from './industries';

// Re-export all constants from the interests module
export * from './interests';

// Re-export all constants from the errorCodes module
export * from './errorCodes';

// Re-export all constants from the networkValue module
export * from './networkValue';

// Global constants
/**
 * API version constant
 * @description Defines the current API version for versioning API endpoints
 */
export const API_VERSION: string = 'v1';

/**
 * Maximum retry attempts constant
 * @description Defines the maximum number of retry attempts for API calls
 */
export const MAX_RETRY_ATTEMPTS: number = 3;

/**
 * Default timeout constant
 * @description Defines the default timeout (in milliseconds) for API requests
 */
export const DEFAULT_TIMEOUT: number = 30000; // 30 seconds

/**
 * Utility function to check if the current environment is production
 * @returns {boolean} True if the current environment is production, false otherwise
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * @fileoverview This file centralizes all constant exports for the Pollen8 platform,
 * providing a single point of access for constants used throughout the application.
 * It addresses the following requirements:
 * 1. Industry Focus: Centralizes industry-related constants (Technical Specification/1.1 System Objectives)
 * 2. Quantifiable Networking: Centralizes network value constants (Technical Specification/1.1 System Objectives)
 * 3. User-Centric Design: Centralizes error codes and messages (Technical Specification/1.1 System Objectives)
 * 
 * By re-exporting constants from various modules and defining global constants,
 * this file ensures consistency and ease of maintenance for all constant values
 * used in the Pollen8 platform.
 */