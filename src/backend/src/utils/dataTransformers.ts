import { ObjectId } from 'mongodb';
import { IUser, IUserCreate, UserResponse } from '@shared/interfaces/user.interface';
import { NETWORK_VALUE_MULTIPLIER } from '@shared/constants/networkValue';

/**
 * Transforms a database user object into an API response format.
 * @param user - The user object from the database
 * @returns Formatted user response object
 * @description Addresses the Data Consistency requirement (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
export function toUserResponse(user: IUser): UserResponse {
  const { _id, phoneNumber, industries, interests, location, networkValue, connectionCount, role, createdAt, lastActive } = user;
  
  return {
    user: {
      id: _id.toHexString(),
      phoneNumber,
      industries: industries.map(industry => ({ id: industry._id.toHexString(), name: industry.name })),
      interests: interests.map(interest => ({ id: interest._id.toHexString(), name: interest.name })),
      location,
      networkValue,
      connectionCount,
      role,
      createdAt: createdAt.toISOString(),
      lastActive: lastActive.toISOString()
    }
  };
}

/**
 * Transforms user creation data into a format suitable for the database model.
 * @param userData - The user creation data
 * @returns Partial user object for database storage
 * @description Addresses the Industry Focus requirement (Technical Specification/1.1 System Objectives)
 */
export function toUserModel(userData: IUserCreate): Partial<IUser> {
  return {
    phoneNumber: userData.phoneNumber,
    industries: userData.industries.map(id => new ObjectId(id)),
    interests: userData.interests.map(id => new ObjectId(id)),
    location: userData.location,
    networkValue: 0,
    connectionCount: 0,
    createdAt: new Date(),
    lastActive: new Date()
  };
}

/**
 * Calculates and transforms the network value based on the number of connections.
 * @param connections - Number of connections
 * @returns Calculated network value
 * @description Addresses the Quantifiable Networking requirement (Technical Specification/1.1 System Objectives)
 */
export function transformNetworkValue(connections: number): number {
  return Number((connections * NETWORK_VALUE_MULTIPLIER).toFixed(2));
}

/**
 * Transforms industry ID strings into MongoDB ObjectIds.
 * @param industryIds - Array of industry ID strings
 * @returns Array of MongoDB ObjectIds
 * @description Supports the Industry Focus requirement (Technical Specification/1.1 System Objectives)
 */
export function transformIndustryIds(industryIds: string[]): ObjectId[] {
  return industryIds.map(id => new ObjectId(id));
}

/**
 * Transforms interest ID strings into MongoDB ObjectIds.
 * @param interestIds - Array of interest ID strings
 * @returns Array of MongoDB ObjectIds
 * @description Supports the User-Centric Design requirement (Technical Specification/1.1 System Objectives)
 */
export function transformInterestIds(interestIds: string[]): ObjectId[] {
  return interestIds.map(id => new ObjectId(id));
}

/**
 * @fileoverview This module provides data transformation functions for converting between different data representations
 * in the Pollen8 platform, ensuring consistent data structures between the database, API, and internal processing.
 * It addresses the following requirements:
 * 1. Data Consistency (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 * 2. Industry Focus (Technical Specification/1.1 System Objectives)
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 */