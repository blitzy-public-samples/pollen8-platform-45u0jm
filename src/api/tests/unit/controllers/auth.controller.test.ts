import { Request, Response } from 'express';
import { AuthController } from '../../../src/controllers/auth.controller';
import { AuthService } from '../../../src/services/auth.service';
import { UserValidator } from '@shared/validators/user.validator';
import { formatResponse } from '../../../src/utils/responseFormatter';
import { IUser, UserResponse } from '@shared/interfaces/user.interface';
import { AUTH_ERRORS } from '@shared/constants/errorCodes';

jest.mock('../../../src/services/auth.service');
jest.mock('@shared/validators/user.validator');
jest.mock('../../../src/utils/responseFormatter');

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockUserValidator: jest.Mocked<UserValidator>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockAuthService = new AuthService() as jest.Mocked<AuthService>;
    mockUserValidator = new UserValidator() as jest.Mocked<UserValidator>;
    authController = new AuthController(mockAuthService, mockUserValidator);
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('sendVerificationCode', () => {
    it('should send verification code for valid phone number', async () => {
      const phoneNumber = '+1234567890';
      const verificationId = 'test-verification-id';
      mockRequest.body = { phoneNumber };
      mockUserValidator.isValidPhoneNumber.mockReturnValue(true);
      mockAuthService.sendVerificationCode.mockResolvedValue(verificationId);

      await authController.sendVerificationCode(mockRequest as Request, mockResponse as Response);

      expect(mockUserValidator.isValidPhoneNumber).toHaveBeenCalledWith(phoneNumber);
      expect(mockAuthService.sendVerificationCode).toHaveBeenCalledWith(phoneNumber);
      expect(formatResponse).toHaveBeenCalledWith(mockResponse, 200, { verificationId });
    });

    it('should return error for invalid phone number', async () => {
      const phoneNumber = 'invalid-number';
      mockRequest.body = { phoneNumber };
      mockUserValidator.isValidPhoneNumber.mockReturnValue(false);

      await authController.sendVerificationCode(mockRequest as Request, mockResponse as Response);

      expect(mockUserValidator.isValidPhoneNumber).toHaveBeenCalledWith(phoneNumber);
      expect(formatResponse).toHaveBeenCalledWith(mockResponse, 400, { error: AUTH_ERRORS.INVALID_PHONE_NUMBER });
    });

    it('should handle internal server error', async () => {
      const phoneNumber = '+1234567890';
      mockRequest.body = { phoneNumber };
      mockUserValidator.isValidPhoneNumber.mockReturnValue(true);
      mockAuthService.sendVerificationCode.mockRejectedValue(new Error('Test error'));

      await authController.sendVerificationCode(mockRequest as Request, mockResponse as Response);

      expect(formatResponse).toHaveBeenCalledWith(mockResponse, 500, { error: 'Internal server error' });
    });
  });

  describe('verifyCode', () => {
    it('should verify code and return user data for valid input', async () => {
      const verificationId = 'test:+1234567890';
      const code = '123456';
      const userData: UserResponse = {
        user: { id: 'user-id', phoneNumber: '+1234567890' } as IUser,
        token: 'test-token'
      };
      mockRequest.body = { verificationId, code };
      mockUserValidator.isValidVerificationCode.mockReturnValue(true);
      mockAuthService.verifyCode.mockResolvedValue(userData);

      await authController.verifyCode(mockRequest as Request, mockResponse as Response);

      expect(mockUserValidator.isValidVerificationCode).toHaveBeenCalledWith(code);
      expect(mockAuthService.verifyCode).toHaveBeenCalledWith('+1234567890', code);
      expect(formatResponse).toHaveBeenCalledWith(mockResponse, 200, userData);
    });

    it('should return error for invalid verification code', async () => {
      const verificationId = 'test:+1234567890';
      const code = 'invalid';
      mockRequest.body = { verificationId, code };
      mockUserValidator.isValidVerificationCode.mockReturnValue(false);

      await authController.verifyCode(mockRequest as Request, mockResponse as Response);

      expect(mockUserValidator.isValidVerificationCode).toHaveBeenCalledWith(code);
      expect(formatResponse).toHaveBeenCalledWith(mockResponse, 400, { error: AUTH_ERRORS.INVALID_VERIFICATION_CODE });
    });

    it('should handle invalid verification code error from service', async () => {
      const verificationId = 'test:+1234567890';
      const code = '123456';
      mockRequest.body = { verificationId, code };
      mockUserValidator.isValidVerificationCode.mockReturnValue(true);
      mockAuthService.verifyCode.mockRejectedValue(new Error(AUTH_ERRORS.INVALID_VERIFICATION_CODE));

      await authController.verifyCode(mockRequest as Request, mockResponse as Response);

      expect(formatResponse).toHaveBeenCalledWith(mockResponse, 400, { error: AUTH_ERRORS.INVALID_VERIFICATION_CODE });
    });

    it('should handle internal server error', async () => {
      const verificationId = 'test:+1234567890';
      const code = '123456';
      mockRequest.body = { verificationId, code };
      mockUserValidator.isValidVerificationCode.mockReturnValue(true);
      mockAuthService.verifyCode.mockRejectedValue(new Error('Test error'));

      await authController.verifyCode(mockRequest as Request, mockResponse as Response);

      expect(formatResponse).toHaveBeenCalledWith(mockResponse, 500, { error: 'Internal server error' });
    });
  });
});

/**
 * @fileoverview This file contains unit tests for the AuthController.
 * It addresses the following requirements:
 * 1. Verified Connections: Tests phone verification functionality (Technical Specification/1.1 System Objectives)
 * 2. User-Centric Design: Validates smooth authentication flow (Technical Specification/1.1 System Objectives)
 * 3. Security Protocols: Verifies secure authentication endpoints (Technical Specification/5. Security Considerations)
 */