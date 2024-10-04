import { Request, Response, NextFunction } from 'express';
import { ObjectId } from 'mongodb';
import { InviteController } from '@controllers/invite.controller';
import { InviteService } from '@services/invite.service';
import { IInvite, InviteResponse } from '@shared/interfaces/invite.interface';
import { formatResponse } from '@utils/responseFormatter';
import { ApiError } from '@utils/ApiError';

// Mock dependencies
jest.mock('@services/invite.service');
jest.mock('@utils/responseFormatter');
jest.mock('@utils/ApiError');

describe('InviteController', () => {
  let mockInviteService: jest.Mocked<InviteService>;
  let inviteController: InviteController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockInviteService = new InviteService() as jest.Mocked<InviteService>;
    inviteController = new InviteController(mockInviteService);
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('createInvite', () => {
    it('should create an invite successfully', async () => {
      // Arrange
      const mockInviteData = { userId: '123456789012345678901234', name: 'Test Invite' };
      const mockCreatedInvite: InviteResponse = {
        id: '234567890123456789012345',
        userId: '123456789012345678901234',
        name: 'Test Invite',
        code: 'ABC123',
        clickCount: 0,
        isActive: true,
        createdAt: new Date(),
      };
      mockRequest.body = mockInviteData;
      mockInviteService.createInvite.mockResolvedValue(mockCreatedInvite);
      (formatResponse as jest.Mock).mockReturnValue(mockCreatedInvite);

      // Act
      await inviteController.createInvite(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockInviteService.createInvite).toHaveBeenCalledWith(new ObjectId(mockInviteData.userId), mockInviteData.name);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCreatedInvite);
    });

    it('should handle validation errors', async () => {
      // Arrange
      const mockInvalidData = { userId: 'invalid', name: '' };
      mockRequest.body = mockInvalidData;

      // Act
      await inviteController.createInvite(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(ApiError).toHaveBeenCalledWith(400, 'Invalid invite data', expect.any(Array));
    });
  });

  describe('getInviteAnalytics', () => {
    it('should retrieve invite analytics successfully', async () => {
      // Arrange
      const mockInviteId = '123456789012345678901234';
      const mockAnalytics: InviteResponse = {
        id: mockInviteId,
        userId: '234567890123456789012345',
        name: 'Test Invite',
        code: 'ABC123',
        clickCount: 10,
        dailyClickData: { '2023-09-01': 5, '2023-09-02': 5 },
        isActive: true,
        createdAt: new Date(),
      };
      mockRequest.params = { inviteId: mockInviteId };
      mockInviteService.getInviteAnalytics.mockResolvedValue(mockAnalytics);
      (formatResponse as jest.Mock).mockReturnValue(mockAnalytics);

      // Act
      await inviteController.getInviteAnalytics(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockInviteService.getInviteAnalytics).toHaveBeenCalledWith(new ObjectId(mockInviteId));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockAnalytics);
    });

    it('should handle invalid invite ID', async () => {
      // Arrange
      mockRequest.params = { inviteId: 'invalid' };

      // Act
      await inviteController.getInviteAnalytics(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('trackInviteClick', () => {
    it('should track invite click successfully', async () => {
      // Arrange
      const mockInviteCode = 'ABC123';
      mockRequest.params = { code: mockInviteCode };

      // Act
      await inviteController.trackInviteClick(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockInviteService.trackInviteClick).toHaveBeenCalledWith(mockInviteCode);
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle tracking errors', async () => {
      // Arrange
      mockRequest.params = { code: 'INVALID' };
      mockInviteService.trackInviteClick.mockRejectedValue(new Error('Invalid invite code'));

      // Act
      await inviteController.trackInviteClick(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateInvite', () => {
    it('should update an invite successfully', async () => {
      // Arrange
      const mockInviteId = '123456789012345678901234';
      const mockUpdateData = { name: 'Updated Invite', isActive: false };
      const mockUpdatedInvite: InviteResponse = {
        id: mockInviteId,
        userId: '234567890123456789012345',
        name: 'Updated Invite',
        code: 'ABC123',
        clickCount: 5,
        isActive: false,
        createdAt: new Date(),
      };
      mockRequest.params = { inviteId: mockInviteId };
      mockRequest.body = mockUpdateData;
      mockInviteService.updateInvite.mockResolvedValue(mockUpdatedInvite);
      (formatResponse as jest.Mock).mockReturnValue(mockUpdatedInvite);

      // Act
      await inviteController.updateInvite(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockInviteService.updateInvite).toHaveBeenCalledWith(new ObjectId(mockInviteId), mockUpdateData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockUpdatedInvite);
    });

    it('should handle validation errors for update', async () => {
      // Arrange
      const mockInvalidData = { name: '' };
      mockRequest.params = { inviteId: '123456789012345678901234' };
      mockRequest.body = mockInvalidData;

      // Act
      await inviteController.updateInvite(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ApiError));
      expect(ApiError).toHaveBeenCalledWith(400, 'Invalid update data', expect.any(Array));
    });
  });

  describe('deactivateInvite', () => {
    it('should deactivate an invite successfully', async () => {
      // Arrange
      const mockInviteId = '123456789012345678901234';
      const mockDeactivatedInvite: InviteResponse = {
        id: mockInviteId,
        userId: '234567890123456789012345',
        name: 'Deactivated Invite',
        code: 'ABC123',
        clickCount: 5,
        isActive: false,
        createdAt: new Date(),
      };
      mockRequest.params = { inviteId: mockInviteId };
      mockInviteService.deactivateInvite.mockResolvedValue(mockDeactivatedInvite);
      (formatResponse as jest.Mock).mockReturnValue(mockDeactivatedInvite);

      // Act
      await inviteController.deactivateInvite(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockInviteService.deactivateInvite).toHaveBeenCalledWith(new ObjectId(mockInviteId));
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockDeactivatedInvite);
    });

    it('should handle errors when deactivating an invite', async () => {
      // Arrange
      mockRequest.params = { inviteId: 'invalid' };

      // Act
      await inviteController.deactivateInvite(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

/**
 * @fileoverview This module contains unit tests for the InviteController class.
 * It covers all the methods of the InviteController, ensuring proper handling of HTTP requests for invite-related operations.
 * 
 * Requirements addressed:
 * 1. Trackable Invite Links (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 2. Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 3. One-click Sharing (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 
 * The tests cover:
 * - Successful creation of invite links
 * - Retrieval of invite analytics
 * - Tracking of invite link clicks
 * - Updating invite properties
 * - Deactivating invite links
 * - Error handling for various scenarios
 * 
 * These tests ensure the robustness and reliability of the invite management system in the Pollen8 platform.
 */