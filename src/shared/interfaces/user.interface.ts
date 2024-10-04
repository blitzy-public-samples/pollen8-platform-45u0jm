import { ObjectId } from 'mongodb';

// Assuming the structure of these interfaces based on their usage
interface IIndustry {
  _id: ObjectId;
  name: string;
}

interface IInterest {
  _id: ObjectId;
  name: string;
}

interface ILocation {
  city: string;
  zipCode: string;
}

// Assuming the structure of UserRole enum
enum UserRole {
  User = 'user',
  Admin = 'admin'
}

/**
 * Defines the structure of a user in the Pollen8 platform
 * @description This interface represents the core user data structure, addressing various system objectives and requirements
 */
export interface IUser {
  /** Unique identifier for the user */
  _id: ObjectId;

  /** User's verified phone number */
  phoneNumber: string;

  /** List of industries the user is associated with */
  industries: IIndustry[];

  /** List of interests the user has selected */
  interests: IInterest[];

  /** User's location information */
  location: ILocation;

  /** Calculated network value of the user */
  networkValue: number;

  /** Number of connections the user has */
  connectionCount: number;

  /** User's role in the system */
  role: UserRole;

  /** Timestamp of when the user account was created */
  createdAt: Date;

  /** Timestamp of the user's last activity */
  lastActive: Date;
}

/**
 * Defines the structure for creating a new user
 * @description This interface is used when registering a new user, containing only the necessary initial information
 */
export interface IUserCreate {
  /** User's phone number for verification */
  phoneNumber: string;

  /** List of industry IDs the user is initially associated with */
  industries: string[];

  /** List of interest IDs the user has initially selected */
  interests: string[];

  /** User's initial location information */
  location: ILocation;
}

/**
 * Defines the structure for updating an existing user
 * @description This interface is used when updating user information, with all fields being optional
 */
export interface IUserUpdate {
  /** Optional list of industry IDs to update */
  industries?: string[];

  /** Optional list of interest IDs to update */
  interests?: string[];

  /** Optional location information to update */
  location?: ILocation;
}

/**
 * Type alias for API response containing user data
 * @description This type is used for API responses that include user data and an optional authentication token
 */
export type UserResponse = {
  /** The user data */
  user: IUser;

  /** Optional authentication token */
  token?: string;
};

/**
 * @fileoverview This file defines the core user-related interfaces for the Pollen8 platform.
 * It addresses several key requirements:
 * 1. Verified Connections: Includes phoneNumber for verification (Technical Specification/1.1 System Objectives)
 * 2. Industry Focus: Provides structure for multiple industry selection (Technical Specification/1.1 System Objectives)
 * 3. Quantifiable Networking: Includes networkValue in user interface (Technical Specification/1.1 System Objectives)
 * 4. User Profile Data: Defines comprehensive user profile structure (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 */