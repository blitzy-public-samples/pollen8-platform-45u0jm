import { ObjectId } from 'mongodb';
import { IUser } from './user.interface';

/**
 * Defines the structure of an interest in the Pollen8 platform
 * @description This interface represents the core interest data structure, addressing various system objectives and requirements
 */
export interface IInterest {
  /** Unique identifier for the interest */
  _id: ObjectId;

  /** Name of the interest */
  name: string;

  /** Category of the interest */
  category: string;

  /** Timestamp of when the interest was created */
  createdAt: Date;

  /** Timestamp of when the interest was last updated */
  updatedAt: Date;
}

/**
 * Defines the structure for creating a new interest
 * @description This interface is used when adding a new interest to the system
 */
export interface IInterestCreate {
  /** Name of the new interest */
  name: string;

  /** Category of the new interest */
  category: string;
}

/**
 * Defines the structure for updating an existing interest
 * @description This interface is used when updating interest information, with all fields being optional
 */
export interface IInterestUpdate {
  /** Optional new name for the interest */
  name?: string;

  /** Optional new category for the interest */
  category?: string;
}

/**
 * Type alias for API response containing interest data
 * @description This type is used for API responses that include interest data
 */
export type InterestResponse = {
  /** The interest data */
  interest: IInterest;
};

/**
 * @fileoverview This file defines the core interest-related interfaces for the Pollen8 platform.
 * It addresses several key requirements:
 * 1. User-Centric Design: Defines user interests for personalized experience (Technical Specification/1.1 System Objectives)
 * 2. Multi-interest Selection: Supports selection of multiple interests per user (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 * 3. Interest Categorization: Enables interest-based user categorization (Technical Specification/1.2 Scope/Core Functionalities)
 * 
 * Notes:
 * - Interest names must be unique within each category
 * - Users are required to select a minimum of 3 interests during profile creation
 * - Interests are used alongside industries for enhanced user matching and networking
 * - The interface supports the platform's minimalist design by focusing on essential data
 * - This interface is used in conjunction with the user interface to support comprehensive user profiling
 */

/**
 * Helper type to represent the relationship between users and interests
 * @description This type is used internally to manage the many-to-many relationship between users and interests
 */
export type UserInterestRelation = {
  userId: ObjectId;
  interestId: ObjectId;
  addedAt: Date;
};

/**
 * Helper function to check if a user has selected the minimum required number of interests
 * @param user The user object to check
 * @returns boolean indicating if the user has selected the minimum required interests
 */
export function hasMinimumInterests(user: IUser): boolean {
  return user.interests.length >= 3;
}

/**
 * Helper function to get unique categories from a list of interests
 * @param interests Array of interests
 * @returns Array of unique categories
 */
export function getUniqueCategories(interests: IInterest[]): string[] {
  return [...new Set(interests.map(interest => interest.category))];
}