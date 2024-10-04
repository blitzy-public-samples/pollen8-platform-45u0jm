import { Request, Response, NextFunction } from 'express';
import { validateRequest, ValidatorType } from '../../../src/middleware/validation.middleware';
import { UserValidator } from '../../../../shared/validators/user.validator';
import { validateConnection, validateInviteCreate } from '../../../../shared/validators/connection.validator';
import { ValidationError } from '../../../../shared/interfaces/error.interface';

// Mock the validators
jest.mock('../../../../shared/validators/user.validator');
jest.mock('../../../../shared/validators/connection.validator');
jest.mock('../../../../shared/validators/invite.validator');

// Mock classes for Request and Response
class MockRequest {
  body: any;
  params: any;

  constructor(body: any, params: any = {}) {
    this.body = body;
    this.params = params;
  }
}

class MockResponse {
  statusCode: number;
  jsonData: any;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  json(data: any) {
    this.jsonData = data;
    return this;
  }
}

describe('Validation Middleware', () => {
  let mockRequest: MockRequest;
  let mockResponse: MockResponse;
  let nextFunction: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockResponse = new MockResponse();
    nextFunction = jest.fn();
  });

  describe('User Validation', () => {
    it('should validate user creation request successfully', () => {
      // Requirement: Verified Connections (Technical Specification/1.1 System Objectives)
      const validUserData = {
        phoneNumber: '+1234567890',
        industries: ['Technology', 'Finance'],
        interests: ['AI', 'Blockchain']
      };
      mockRequest = new MockRequest(validUserData);

      (UserValidator.validateCreate as jest.Mock).mockReturnValue({ isValid: true });

      validateRequest(ValidatorType.USER_CREATE)(mockRequest as unknown as Request, mockResponse as unknown as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.statusCode).toBeUndefined();
    });

    it('should return 400 for invalid user data', () => {
      // Requirement: User-Centric Design (Technical Specification/1.1 System Objectives)
      const invalidUserData = {
        phoneNumber: 'invalid',
        industries: [],
        interests: ['AI']
      };
      mockRequest = new MockRequest(invalidUserData);

      const mockErrors: ValidationError[] = [
        { field: 'phoneNumber', message: 'Invalid phone number format' },
        { field: 'industries', message: 'At least one industry is required' }
      ];
      (UserValidator.validateCreate as jest.Mock).mockReturnValue({ isValid: false, errors: mockErrors });

      validateRequest(ValidatorType.USER_CREATE)(mockRequest as unknown as Request, mockResponse as unknown as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.jsonData).toEqual({
        error: 'Validation failed',
        details: mockErrors
      });
    });
  });

  describe('Connection Validation', () => {
    it('should validate connection creation request successfully', () => {
      // Requirement: Industry Focus (Technical Specification/1.2 Scope/Limitations and Constraints)
      const validConnectionData = {
        userId: 'user123',
        connectedUserId: 'user456',
        sharedIndustries: ['Technology']
      };
      mockRequest = new MockRequest(validConnectionData);

      (validateConnection as jest.Mock).mockReturnValue({ isValid: true });

      validateRequest(ValidatorType.CONNECTION_CREATE)(mockRequest as unknown as Request, mockResponse as unknown as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.statusCode).toBeUndefined();
    });

    it('should return 400 for invalid connection data', () => {
      const invalidConnectionData = {
        userId: 'user123',
        connectedUserId: 'user123', // Same as userId, which should be invalid
        sharedIndustries: []
      };
      mockRequest = new MockRequest(invalidConnectionData);

      const mockErrors: ValidationError[] = [
        { field: 'connectedUserId', message: 'Cannot connect to self' },
        { field: 'sharedIndustries', message: 'At least one shared industry is required' }
      ];
      (validateConnection as jest.Mock).mockReturnValue({ isValid: false, errors: mockErrors });

      validateRequest(ValidatorType.CONNECTION_CREATE)(mockRequest as unknown as Request, mockResponse as unknown as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.jsonData).toEqual({
        error: 'Validation failed',
        details: mockErrors
      });
    });
  });

  describe('Invite Validation', () => {
    it('should validate invite creation request successfully', () => {
      const validInviteData = {
        name: 'Tech Conference 2023',
        userId: 'user123'
      };
      mockRequest = new MockRequest(validInviteData);

      (validateInviteCreate as jest.Mock).mockReturnValue({ isValid: true });

      validateRequest(ValidatorType.INVITE_CREATE)(mockRequest as unknown as Request, mockResponse as unknown as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.statusCode).toBeUndefined();
    });

    it('should return 400 for invalid invite data', () => {
      const invalidInviteData = {
        name: '', // Empty name should be invalid
        userId: 'user123'
      };
      mockRequest = new MockRequest(invalidInviteData);

      const mockErrors: ValidationError[] = [
        { field: 'name', message: 'Invite name is required' }
      ];
      (validateInviteCreate as jest.Mock).mockReturnValue({ isValid: false, errors: mockErrors });

      validateRequest(ValidatorType.INVITE_CREATE)(mockRequest as unknown as Request, mockResponse as unknown as Response, nextFunction);

      expect(nextFunction).not.toHaveBeenCalled();
      expect(mockResponse.statusCode).toBe(400);
      expect(mockResponse.jsonData).toEqual({
        error: 'Validation failed',
        details: mockErrors
      });
    });
  });

  // Additional tests can be added here for other validator types and edge cases
});