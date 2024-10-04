import { model, Model, Document } from 'mongoose';
import { IUser } from '@shared/interfaces/user.interface';
import UserSchema, { USER_COLLECTION } from '@shared/schemas/user.schema';

/**
 * Interface for the User model, extending the base IUser interface with Mongoose document methods
 * @description This interface adds Mongoose-specific functionality to the base user interface
 */
export interface IUserModel extends IUser, Document {
  /**
   * Calculates the user's network value based on their connection count
   * @returns {number} The calculated network value
   */
  calculateNetworkValue(): number;

  /**
   * Updates the user's lastActive timestamp to the current time
   * @returns {Promise<void>} A promise that resolves when the update is complete
   */
  updateLastActive(): Promise<void>;
}

/**
 * User model implementation for MongoDB using Mongoose
 * @description This model provides an interface between the application and the database for user data
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives)
 *   Implements model for phone verification
 * - Industry Focus (Technical Specification/1.1 System Objectives)
 *   Enables multi-industry user categorization
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *   Implements network value calculation
 * - User Data Management (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 *   Provides database interface for user data
 */
class UserModel {
  private model: Model<IUserModel>;

  constructor() {
    this.model = model<IUserModel>(USER_COLLECTION, UserSchema);
  }

  /**
   * Get the Mongoose model for User
   * @returns {Model<IUserModel>} The Mongoose model for User
   */
  getModel(): Model<IUserModel> {
    return this.model;
  }

  /**
   * Create a new user in the database
   * @param {Partial<IUser>} userData - The user data to create
   * @returns {Promise<IUserModel>} The created user document
   */
  async createUser(userData: Partial<IUser>): Promise<IUserModel> {
    const user = new this.model(userData);
    await user.save();
    return user;
  }

  /**
   * Find a user by their ID
   * @param {string} id - The user's ID
   * @returns {Promise<IUserModel | null>} The found user document or null if not found
   */
  async findUserById(id: string): Promise<IUserModel | null> {
    return this.model.findById(id).exec();
  }

  /**
   * Find a user by their phone number
   * @param {string} phoneNumber - The user's phone number
   * @returns {Promise<IUserModel | null>} The found user document or null if not found
   */
  async findUserByPhoneNumber(phoneNumber: string): Promise<IUserModel | null> {
    return this.model.findOne({ phoneNumber }).exec();
  }

  /**
   * Update a user's information
   * @param {string} id - The user's ID
   * @param {Partial<IUser>} updateData - The data to update
   * @returns {Promise<IUserModel | null>} The updated user document or null if not found
   */
  async updateUser(id: string, updateData: Partial<IUser>): Promise<IUserModel | null> {
    return this.model.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  /**
   * Delete a user from the database
   * @param {string} id - The user's ID
   * @returns {Promise<IUserModel | null>} The deleted user document or null if not found
   */
  async deleteUser(id: string): Promise<IUserModel | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  /**
   * Increment a user's connection count and recalculate their network value
   * @param {string} id - The user's ID
   * @returns {Promise<IUserModel | null>} The updated user document or null if not found
   */
  async incrementConnectionCount(id: string): Promise<IUserModel | null> {
    const user = await this.model.findById(id);
    if (!user) return null;

    user.connectionCount += 1;
    user.calculateNetworkValue();
    await user.save();
    return user;
  }

  /**
   * Update a user's last active timestamp
   * @param {string} id - The user's ID
   * @returns {Promise<IUserModel | null>} The updated user document or null if not found
   */
  async updateLastActive(id: string): Promise<IUserModel | null> {
    return this.model.findByIdAndUpdate(id, { lastActive: new Date() }, { new: true }).exec();
  }
}

// Export a singleton instance of the UserModel
export const userModel = new UserModel();

// Export the IUserModel interface for use in other parts of the application
export { IUserModel };