import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { IUser, IUserCreate, IUserUpdate } from '@shared/interfaces/user.interface';
import { formatResponse } from '../utils/responseFormatter';

/**
 * Controller class handling user-related HTTP requests
 * @description This controller implements the interface between client requests and the user service layer
 */
@injectable()
export class UserController {
  constructor(
    @inject(UserService) private userService: UserService
  ) {}

  /**
   * Handles POST request to create a new user
   * @param req Express request object
   * @param res Express response object
   * @returns Promise resolving to Express response object with created user data
   */
  async createUser(req: Request, res: Response): Promise<Response> {
    try {
      const userData: IUserCreate = req.body;
      const createdUser: IUser = await this.userService.createUser(userData);
      return formatResponse(res, 201, 'User created successfully', { user: createdUser });
    } catch (error) {
      return formatResponse(res, 400, 'Failed to create user', null, error.message);
    }
  }

  /**
   * Handles PUT request to update an existing user
   * @param req Express request object
   * @param res Express response object
   * @returns Promise resolving to Express response object with updated user data
   */
  async updateUser(req: Request, res: Response): Promise<Response> {
    try {
      const userId: string = req.user.id; // Assuming user ID is attached to request by auth middleware
      const updateData: IUserUpdate = req.body;
      const updatedUser: IUser = await this.userService.updateUser(userId, updateData);
      return formatResponse(res, 200, 'User updated successfully', { user: updatedUser });
    } catch (error) {
      return formatResponse(res, 400, 'Failed to update user', null, error.message);
    }
  }

  /**
   * Handles GET request to retrieve a user's profile
   * @param req Express request object
   * @param res Express response object
   * @returns Promise resolving to Express response object with user profile data
   */
  async getUserProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId: string = req.user.id; // Assuming user ID is attached to request by auth middleware
      const user: IUser = await this.userService.getUserById(userId);
      return formatResponse(res, 200, 'User profile retrieved successfully', { user });
    } catch (error) {
      return formatResponse(res, 404, 'User not found', null, error.message);
    }
  }

  /**
   * Handles GET request to calculate and return a user's network value
   * @param req Express request object
   * @param res Express response object
   * @returns Promise resolving to Express response object with user's network value
   */
  async getNetworkValue(req: Request, res: Response): Promise<Response> {
    try {
      const userId: string = req.user.id; // Assuming user ID is attached to request by auth middleware
      const networkValue: number = await this.userService.calculateNetworkValue(userId);
      return formatResponse(res, 200, 'Network value calculated successfully', { networkValue });
    } catch (error) {
      return formatResponse(res, 400, 'Failed to calculate network value', null, error.message);
    }
  }
}

/**
 * @fileoverview This controller file implements the HTTP request handling for user-related operations in the Pollen8 platform.
 * It addresses the following requirements:
 * 1. Verified Connections: Handles user verification endpoints (Technical Specification/1.1 System Objectives)
 * 2. Industry Focus: Processes industry selection in user profiles (Technical Specification/1.1 System Objectives)
 * 3. Quantifiable Networking: Returns network value in user responses (Technical Specification/1.1 System Objectives)
 * 4. User-Centric Design: Provides clear, consistent API responses (Technical Specification/1.1 System Objectives)
 */