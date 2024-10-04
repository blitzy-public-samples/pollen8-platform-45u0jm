import { ENVIRONMENTS } from '../config/environments';

/**
 * Core system-wide constants used across the Pollen8 platform.
 * These constants focus on configuration-specific values that may vary between environments.
 */

/**
 * The constant value used in network value calculations.
 * @constant
 * @type {number}
 * @description Addresses the "Quantifiable Networking" requirement from Technical Specification/1.2 Scope.
 */
export const NETWORK_VALUE_CONSTANT: number = 3.14;

/**
 * The minimum number of industries a user can select.
 * @constant
 * @type {number}
 * @description Addresses the "Industry Focus" requirement from Technical Specification/1.1 System Objectives.
 */
export const MIN_INDUSTRIES: number = 3;

/**
 * The maximum number of industries a user can select.
 * @constant
 * @type {number}
 * @description Addresses the "Industry Focus" requirement from Technical Specification/1.1 System Objectives.
 */
export const MAX_INDUSTRIES: number = 5;

/**
 * The length of the SMS verification code.
 * @constant
 * @type {number}
 * @description Addresses the "Verified Connections" requirement from Technical Specification/1.1 System Objectives.
 */
export const SMS_CODE_LENGTH: number = 6;

/**
 * The expiry time for SMS verification codes in milliseconds (5 minutes).
 * @constant
 * @type {number}
 * @description Addresses the "Verified Connections" requirement from Technical Specification/1.1 System Objectives.
 */
export const SMS_CODE_EXPIRY: number = 300000;

/**
 * The API rate limit (requests per minute).
 * @constant
 * @type {number}
 */
export const API_RATE_LIMIT: number = 100;

/**
 * The default cache Time-To-Live (TTL) in seconds (1 hour).
 * @constant
 * @type {number}
 */
export const CACHE_TTL: number = 3600;

/**
 * The default UI animation duration in milliseconds.
 * @constant
 * @type {number}
 * @description Addresses the "User-Centric Design" requirement from Technical Specification/1.1 System Objectives.
 */
export const UI_ANIMATION_DURATION: number = 300;

/**
 * A utility function to retrieve configuration values with environment-specific overrides.
 * @template T
 * @param {string} key - The configuration key to retrieve.
 * @param {T} defaultValue - The default value to return if the key is not found.
 * @returns {T} The configuration value for the given key, or the default value if not found.
 */
export function getConfigValue<T>(key: string, defaultValue: T): T {
  const currentEnv = process.env.NODE_ENV || 'development';
  const envConfig = ENVIRONMENTS[currentEnv];

  if (envConfig && key in envConfig) {
    return envConfig[key] as T;
  }

  return defaultValue;
}

// Export all constants as a single object for easier imports
export const Constants = {
  NETWORK_VALUE_CONSTANT,
  MIN_INDUSTRIES,
  MAX_INDUSTRIES,
  SMS_CODE_LENGTH,
  SMS_CODE_EXPIRY,
  API_RATE_LIMIT,
  CACHE_TTL,
  UI_ANIMATION_DURATION,
};