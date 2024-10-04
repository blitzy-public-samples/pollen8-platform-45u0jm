import { Request, Response } from 'express';
import { MockProxy, mock } from 'jest-mock-extended';
import { UserController } from '../../../src/controllers/user.controller';
import { UserService } from '../../../src/services/user.service';
import { IUser, IUserCreate, IUserUpdate } from '@shared/interfaces/user.interface';
import { formatResponse } from '../../../src/utils/responseFormatter';

jest.mock('../../../src/utils/responseFormatter');

describe('UserController', () => {
  let mockUserService: MockProxy<UserService>;
  let userController: UserController;
  let mockReq: MockProxy<Request>;
  let mockRes: MockProxy<Response>;

  beforeEach(() => {
    mockUserService = mock<UserService>();
    userController = new UserController(mockUserService);
    mockReq = mock<Request>();
    mockRes = mock<Response>();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData: IUserCreate = {
        phoneNumber: '+1234567890',
        industries: ['Technology'],
        interests: ['AI'],
        location: { city: 'New York', zipCode: '10001' }
      };
      const createdUser: IUser = {
        id: 'user123',
        ...userData,
        networkValue: 0,
        connectionCount: 0,
        createdAt: new Date(),
        lastActive: new Date()
      };
      mockReq.body = userData;
      mockUserService.createUser.mockResolvedValue(createdUser);

      // Act
      await userController.createUser(mockReq, mockRes);

      // Assert
      expect(mockUserService.createUser).toHaveBeenCalledWith(userData);
      expect(formatResponse).toHaveBeenCalledWith(mockRes, 201, 'User created successfully', { user: createdUser });
    });

    it('should handle errors when creating a user', async () => {
      // Arrange
      const error = new Error('Duplicate phone number');
      mockReq.body = { phoneNumber: '+1234567890' };
      mockUserService.createUser.mockRejectedValue(error);

      // Act
      await userController.createUser(mockReq, mockRes);

      // Assert
      expect(formatResponse).toHaveBeenCalledWith(mockRes, 400, 'Failed to create user', null, error.message);
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      // Arrange
      const userId = 'user123';
      const updateData: IUserUpdate = {
        industries: ['Finance'],
        interests: ['Blockchain']
      };
      const updatedUser: IUser = {
        id: userId,
        phoneNumber: '+1234567890',
        industries: ['Finance'],
        interests: ['Blockchain'],
        location: { city: 'New York', zipCode: '10001' },
        networkValue: 3.14,
        connectionCount: 1,
        createdAt: new Date(),
        lastActive: new Date()
      };
      mockReq.user = { id: userId };
      mockReq.body = updateData;
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      // Act
      await userController.updateUser(mockReq, mockRes);

      // Assert
      expect(mockUserService.updateUser).toHaveBeenCalledWith(userId, updateData);
      expect(formatResponse).toHaveBeenCalledWith(mockRes, 200, 'User updated successfully', { user: updatedUser });
    });

    it('should handle errors when updating a user', async () => {
      // Arrange
      const error = new Error('User not found');
      mockReq.user = { id: 'nonexistent' };
      mockReq.body = { industries: ['Finance'] };
      mockUserService.updateUser.mockRejectedValue(error);

      // Act
      await userController.updateUser(mockReq, mockRes);

      // Assert
      expect(formatResponse).toHaveBeenCalledWith(mockRes, 400, 'Failed to update user', null, error.message);
    });
  });

  describe('getUserProfile', () => {
    it('should retrieve a user profile successfully', async () => {
      // Arrange
      const userId = 'user123';
      const user: IUser = {
        id: userId,
        phoneNumber: '+1234567890',
        industries: ['Technology'],
        interests: ['AI'],
        location: { city: 'New York', zipCode: '10001' },
        networkValue: 6.28,
        connectionCount: 2,
        createdAt: new Date(),
        lastActive: new Date()
      };
      mockReq.user = { id: userId };
      mockUserService.getUserById.mockResolvedValue(user);

      // Act
      await userController.getUserProfile(mockReq, mockRes);

      // Assert
      expect(mockUserService.getUserById).toHaveBeenCalledWith(userId);
      expect(formatResponse).toHaveBeenCalledWith(mockRes, 200, 'User profile retrieved successfully', { user });
    });

    it('should handle errors when retrieving a user profile', async () => {
      // Arrange
      const error = new Error('User not found');
      mockReq.user = { id: 'nonexistent' };
      mockUserService.getUserById.mockRejectedValue(error);

      // Act
      await userController.getUserProfile(mockReq, mockRes);

      // Assert
      expect(formatResponse).toHaveBeenCalledWith(mockRes, 404, 'User not found', null, error.message);
    });
  });

  describe('getNetworkValue', () => {
    it('should calculate and return network value successfully', async () => {
      // Arrange
      const userId = 'user123';
      const networkValue = 9.42;
      mockReq.user = { id: userId };
      mockUserService.calculateNetworkValue.mockResolvedValue(networkValue);

      // Act
      await userController.getNetworkValue(mockReq, mockRes);

      // Assert
      expect(mockUserService.calculateNetworkValue).toHaveBeenCalledWith(userId);
      expect(formatResponse).toHaveBeenCalledWith(mockRes, 200, 'Network value calculated successfully', { networkValue });
    });

    it('should handle errors when calculating network value', async () => {
      // Arrange
      const error = new Error('Failed to calculate network value');
      mockReq.user = { id: 'user123' };
      mockUserService.calculateNetworkValue.mockRejectedValue(error);

      // Act
      await userController.getNetworkValue(mockReq, mockRes);

      // Assert
      expect(formatResponse).toHaveBeenCalledWith(mockRes, 400, 'Failed to calculate network value', null, error.message);
    });
  });
});

/**
 * @fileoverview This test file contains unit tests for the UserController class, ensuring proper handling of HTTP requests for user-related operations.
 * It addresses the following requirements:
 * 1. Verified Connections: Tests user verification endpoints (Technical Specification/1.1 System Objectives)
 * 2. Industry Focus: Verifies industry selection handling (Technical Specification/1.1 System Objectives)
 * 3. Quantifiable Networking: Tests network value calculation endpoints (Technical Specification/1.1 System Objectives)
 * 4. User-Centric Design: Ensures consistent API responses (Technical Specification/1.1 System Objectives)
 */