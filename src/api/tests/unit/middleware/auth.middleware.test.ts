import { Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '@api/middleware/auth.middleware';
import { IUser } from '@shared/interfaces/user.interface';
import { UserRole } from '@shared/enums/userRole.enum';
import { AuthErrors } from '@shared/constants/errorCodes';
import jwt from 'jsonwebtoken';
import config from '@api/config';

// Mock the jwt module
jest.mock('jsonwebtoken');

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  describe('authenticate middleware', () => {
    it('should pass authentication with valid token', async () => {
      const mockUser: IUser = {
        _id: '123',
        phoneNumber: '+1234567890',
        role: UserRole.USER,
      } as IUser;

      mockRequest.headers = {
        authorization: 'Bearer valid_token',
      };

      (jwt.verify as jest.Mock).mockReturnValue({ userId: mockUser._id });

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('should reject authentication with missing token', async () => {
      mockRequest.headers = {};

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: AuthErrors.SESSION_EXPIRED,
        message: 'Authentication token is missing',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject authentication with invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_token',
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: AuthErrors.SESSION_EXPIRED,
        message: 'Invalid authentication token',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle expired tokens', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired_token',
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: AuthErrors.SESSION_EXPIRED,
        message: 'Your session has expired. Please log in again.',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('requireRole middleware', () => {
    it('should allow access for correct role', () => {
      const mockUser: IUser = {
        _id: '123',
        phoneNumber: '+1234567890',
        role: UserRole.ADMIN,
      } as IUser;

      mockRequest.user = mockUser;

      const middleware = requireRole(UserRole.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject access for incorrect role', () => {
      const mockUser: IUser = {
        _id: '123',
        phoneNumber: '+1234567890',
        role: UserRole.USER,
      } as IUser;

      mockRequest.user = mockUser;

      const middleware = requireRole(UserRole.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'FORBIDDEN',
        message: 'Insufficient permissions to access this resource',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle missing user object', () => {
      mockRequest.user = undefined;

      const middleware = requireRole(UserRole.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: AuthErrors.SESSION_EXPIRED,
        message: 'User not authenticated',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});