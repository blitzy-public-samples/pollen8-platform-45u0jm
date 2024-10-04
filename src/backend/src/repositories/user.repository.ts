import { injectable } from 'inversify';
import { ObjectId } from 'mongodb';
import { IUser, IUserCreate, IUserUpdate } from '@shared/interfaces/user.interface';
import { userModel, IUserModel } from '../models/user.model';
import { handleError, createValidationError } from '../utils/errorHandlers';
import { ErrorCode } from '@shared/constants/errorCodes';

/**
 * UserRepository class
 * @description Implements the data access layer for user-related operations in the Pollen8 platform
 * @class UserRepository
 */
@injectable()
export class UserRepository {
  private model = userModel.getModel();

  /**
   * Creates a new user in the database
   * @param {IUserCreate} userData - The user data to create
   * @returns {Promise<IUser>} Created user object
   */
  async createUser(userData: IUserCreate): Promise<IUser> {
    try {
      // Validate user data
      this.validateUserData(userData);

      // Check for duplicate phone number
      const existingUser = await this.findUserByPhone(userData.phoneNumber);
      if (existingUser) {
        throw createValidationError(ErrorCode.DUPLICATE_PHONE_NUMBER);
      }

      // Create new user document
      const newUser = await this.model.create(userData);

      // Return created user
      return newUser.toObject();
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  /**
   * Finds a user by their phone number
   * @param {string} phoneNumber - The phone number to search for
   * @returns {Promise<IUser | null>} Found user or null
   */
  async findUserByPhone(phoneNumber: string): Promise<IUser | null> {
    try {
      const user = await this.model.findOne({ phoneNumber }).exec();
      return user ? user.toObject() : null;
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  /**
   * Updates an existing user's information
   * @param {ObjectId} userId - The ID of the user to update
   * @param {IUserUpdate} updateData - The data to update
   * @returns {Promise<IUser>} Updated user object
   */
  async updateUser(userId: ObjectId, updateData: IUserUpdate): Promise<IUser> {
    try {
      // Validate update data
      this.validateUpdateData(updateData);

      // Find and update user document
      const updatedUser = await this.model.findByIdAndUpdate(userId, updateData, { new: true }).exec();

      if (!updatedUser) {
        throw createValidationError(ErrorCode.USER_NOT_FOUND);
      }

      // Return updated user
      return updatedUser.toObject();
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  /**
   * Finds all users in a specific industry
   * @param {ObjectId} industryId - The ID of the industry to search for
   * @returns {Promise<IUser[]>} Array of users in the industry
   */
  async findUsersInIndustry(industryId: ObjectId): Promise<IUser[]> {
    try {
      const users = await this.model.find({ 'industries._id': industryId }).exec();
      return users.map(user => user.toObject());
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  /**
   * Finds users within a specified radius of a location
   * @param {ILocation} location - The center location to search from
   * @param {number} radiusInMiles - The radius to search within
   * @returns {Promise<IUser[]>} Array of nearby users
   */
  async findNearbyUsers(location: ILocation, radiusInMiles: number): Promise<IUser[]> {
    try {
      // Convert miles to meters for MongoDB's $geoNear
      const radiusInMeters = radiusInMiles * 1609.34;

      const users = await this.model.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: [location.longitude, location.latitude]
            },
            distanceField: 'distance',
            maxDistance: radiusInMeters,
            spherical: true
          }
        }
      ]).exec();

      return users.map(user => user.toObject());
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  /**
   * Validates user data for creation
   * @param {IUserCreate} userData - The user data to validate
   * @throws {ValidationError} If validation fails
   */
  private validateUserData(userData: IUserCreate): void {
    if (!userData.phoneNumber || !userData.industries || userData.industries.length < 3) {
      throw createValidationError(ErrorCode.INVALID_USER_DATA);
    }
  }

  /**
   * Validates user data for update
   * @param {IUserUpdate} updateData - The update data to validate
   * @throws {ValidationError} If validation fails
   */
  private validateUpdateData(updateData: IUserUpdate): void {
    if (updateData.industries && updateData.industries.length < 3) {
      throw createValidationError(ErrorCode.INVALID_USER_DATA);
    }
  }
}

/**
 * This file implements the data access layer for user-related operations in the Pollen8 platform.
 * It provides a clean interface between the business logic and the database while ensuring
 * data integrity and proper error handling.
 *
 * Requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives)
 *    - Implements data access for phone verification
 * 2. Industry Focus (Technical Specification/1.1 System Objectives)
 *    - Enables data operations for multi-industry users
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Handles network value calculations in data layer
 * 4. User Data Management (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 *    - Provides CRUD operations for user profiles
 */