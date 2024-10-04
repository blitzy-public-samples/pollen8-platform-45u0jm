import { injectable } from 'inversify';
import { ObjectId } from 'mongodb';
import { IUser, IUserCreate, IUserUpdate } from '@shared/interfaces/user.interface';
import { UserRepository } from '@database/repositories/user.repository';
import { NETWORK_VALUE_PER_CONNECTION } from '@shared/constants/networkValue';
import { formatResponse } from '@api/utils/responseFormatter';

/**
 * Service class handling all user-related business logic
 * @description This service implements core functionality for user management in the Pollen8 platform
 */
@injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Creates a new user in the system with provided data
   * @param userData The data for creating a new user
   * @returns Promise resolving to the created user object
   */
  async createUser(userData: IUserCreate): Promise<IUser> {
    // Validate user data
    this.validateUserData(userData);

    // Check for duplicate phone number
    const existingUser = await this.getUserByPhoneNumber(userData.phoneNumber);
    if (existingUser) {
      throw new Error('Phone number already in use');
    }

    // Create user record
    const newUser: IUser = {
      ...userData,
      _id: new ObjectId(),
      networkValue: 0,
      connectionCount: 0,
      role: 'user',
      createdAt: new Date(),
      lastActive: new Date()
    };

    const createdUser = await this.userRepository.create(newUser);

    // Initialize network value
    await this.calculateNetworkValue(createdUser._id.toString());

    return createdUser;
  }

  /**
   * Updates an existing user's information
   * @param userId The ID of the user to update
   * @param updateData The data to update for the user
   * @returns Promise resolving to the updated user object
   */
  async updateUser(userId: string, updateData: IUserUpdate): Promise<IUser> {
    // Validate update data
    this.validateUpdateData(updateData);

    // Check user exists
    const existingUser = await this.getUserById(userId);
    if (!existingUser) {
      throw new Error('User not found');
    }

    // Update user record
    const updatedUser = await this.userRepository.update(userId, updateData);

    return updatedUser;
  }

  /**
   * Retrieves a user by their ID
   * @param userId The ID of the user to retrieve
   * @returns Promise resolving to the user object if found
   */
  async getUserById(userId: string): Promise<IUser> {
    // Validate user ID
    if (!ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    // Retrieve user from repository
    const user = await this.userRepository.findById(userId);

    // Throw error if user not found
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Retrieves a user by their phone number
   * @param phoneNumber The phone number of the user to retrieve
   * @returns Promise resolving to the user object if found, null otherwise
   */
  async getUserByPhoneNumber(phoneNumber: string): Promise<IUser | null> {
    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    // Query repository by phone number
    const user = await this.userRepository.findByPhoneNumber(phoneNumber);

    return user;
  }

  /**
   * Calculates the network value for a user based on their connections
   * @param userId The ID of the user for which to calculate the network value
   * @returns Promise resolving to the calculated network value
   */
  async calculateNetworkValue(userId: string): Promise<number> {
    // Get user's connection count
    const user = await this.getUserById(userId);
    const connectionCount = user.connectionCount;

    // Multiply by NETWORK_VALUE_PER_CONNECTION (3.14)
    const networkValue = connectionCount * NETWORK_VALUE_PER_CONNECTION;

    // Update user's network value
    await this.userRepository.update(userId, { networkValue });

    return networkValue;
  }

  /**
   * Validates user data for creation
   * @param userData The user data to validate
   */
  private validateUserData(userData: IUserCreate): void {
    if (!this.isValidPhoneNumber(userData.phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    if (!userData.industries || userData.industries.length < 3) {
      throw new Error('At least 3 industries must be selected');
    }

    if (!userData.interests || userData.interests.length < 3) {
      throw new Error('At least 3 interests must be selected');
    }

    if (!userData.location || !userData.location.city || !userData.location.zipCode) {
      throw new Error('Location information is required');
    }
  }

  /**
   * Validates update data for user
   * @param updateData The update data to validate
   */
  private validateUpdateData(updateData: IUserUpdate): void {
    if (updateData.industries && updateData.industries.length < 3) {
      throw new Error('At least 3 industries must be selected');
    }

    if (updateData.interests && updateData.interests.length < 3) {
      throw new Error('At least 3 interests must be selected');
    }

    if (updateData.location && (!updateData.location.city || !updateData.location.zipCode)) {
      throw new Error('Both city and zip code are required for location update');
    }
  }

  /**
   * Validates phone number format
   * @param phoneNumber The phone number to validate
   * @returns Boolean indicating if the phone number is valid
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Implement phone number validation logic
    // This is a simple example and should be replaced with a more robust validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }
}

/**
 * @fileoverview This service file implements the core business logic for user-related operations in the Pollen8 platform.
 * It addresses the following requirements:
 * 1. Verified Connections: Implements phone verification logic (Technical Specification/1.1 System Objectives)
 * 2. Industry Focus: Handles multi-industry selection and management (Technical Specification/1.1 System Objectives)
 * 3. Quantifiable Networking: Calculates and updates network values (Technical Specification/1.1 System Objectives)
 * 4. User Management: Implements CRUD operations for user profiles (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 */