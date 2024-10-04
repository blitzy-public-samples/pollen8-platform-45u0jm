/**
 * This file defines the constant index definitions for MongoDB collections in the Pollen8 platform,
 * ensuring optimal query performance and data access patterns.
 * 
 * Requirements addressed:
 * 1. Database Performance (Technical Specification/2.3.2 Backend Components/DataAccessLayer):
 *    Defines indexes for efficient data retrieval
 * 2. Phone Verification (Technical Specification/1.1 System Objectives/Verified Connections):
 *    Enables fast lookup of users by phone number
 * 3. Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus):
 *    Supports efficient filtering of connections by industry
 * 4. Invite Tracking (Technical Specification/1.2 Scope/Core Functionalities):
 *    Facilitates quick access to invite analytics
 */

import { USERS_COLLECTION, CONNECTIONS_COLLECTION, INVITES_COLLECTION } from './collections';

/**
 * Index definition for fast user lookup by phone number
 */
export const USER_PHONE_INDEX = {
  collection: USERS_COLLECTION,
  key: { phoneNumber: 1 },
  unique: true
};

/**
 * Index definition for efficient geolocation-based queries
 */
export const USER_LOCATION_INDEX = {
  collection: USERS_COLLECTION,
  key: { zipCode: 1 }
};

/**
 * Index definition for quick retrieval of user connections
 */
export const CONNECTION_USER_INDEX = {
  collection: CONNECTIONS_COLLECTION,
  key: { userId: 1, connectedUserId: 1 }
};

/**
 * Index definition for efficient industry-based filtering of connections
 */
export const CONNECTION_INDUSTRY_INDEX = {
  collection: CONNECTIONS_COLLECTION,
  key: { sharedIndustries: 1 }
};

/**
 * Index definition for fast invite code lookup
 */
export const INVITE_CODE_INDEX = {
  collection: INVITES_COLLECTION,
  key: { code: 1 },
  unique: true
};

/**
 * Index definition for efficient retrieval of user's invites
 */
export const INVITE_USER_INDEX = {
  collection: INVITES_COLLECTION,
  key: { userId: 1 }
};

/**
 * Object containing all index definitions for easy import and usage
 */
export const INDEXES = {
  USER_PHONE: USER_PHONE_INDEX,
  USER_LOCATION: USER_LOCATION_INDEX,
  CONNECTION_USER: CONNECTION_USER_INDEX,
  CONNECTION_INDUSTRY: CONNECTION_INDUSTRY_INDEX,
  INVITE_CODE: INVITE_CODE_INDEX,
  INVITE_USER: INVITE_USER_INDEX
};

/**
 * Type definition for index names to ensure type-safe access
 */
export type IndexName = keyof typeof INDEXES;

/**
 * Interface defining the structure of an index definition
 */
export interface IndexDefinition {
  collection: string;
  key: { [key: string]: 1 | -1 };
  unique?: boolean;
}