/**
 * This file defines the constant collection names used throughout the Pollen8 platform's database layer,
 * ensuring consistency in database operations across the application.
 * 
 * Requirements addressed:
 * 1. Data Organization (Technical Specification/2.3.2 Backend Components/DataAccessLayer):
 *    Defines standardized collection names for MongoDB
 * 2. Maintainability (Technical Specification/2.1 Programming Languages):
 *    Centralizes collection names for easy updates and maintenance
 */

/**
 * Collection name for storing user data
 */
export const USERS_COLLECTION = 'users';

/**
 * Collection name for storing connection data between users
 */
export const CONNECTIONS_COLLECTION = 'connections';

/**
 * Collection name for storing invite data
 */
export const INVITES_COLLECTION = 'invites';

/**
 * Collection name for storing industry data
 */
export const INDUSTRIES_COLLECTION = 'industries';

/**
 * Collection name for storing interest data
 */
export const INTERESTS_COLLECTION = 'interests';

/**
 * Collection name for storing location data
 */
export const LOCATIONS_COLLECTION = 'locations';

/**
 * Object containing all collection names for easy import and usage
 */
export const COLLECTIONS = {
  USERS: USERS_COLLECTION,
  CONNECTIONS: CONNECTIONS_COLLECTION,
  INVITES: INVITES_COLLECTION,
  INDUSTRIES: INDUSTRIES_COLLECTION,
  INTERESTS: INTERESTS_COLLECTION,
  LOCATIONS: LOCATIONS_COLLECTION,
};

/**
 * Use this type for type-safe access to collection names
 */
export type CollectionName = keyof typeof COLLECTIONS;