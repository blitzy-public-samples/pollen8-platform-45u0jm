import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { UserValidator } from '@shared/validators/user.validator';
import { formatResponse } from '../utils/responseFormatter';
import { IUser, UserResponse } from '@shared/interfaces/user.interface';
import { AUTH_ERRORS } from '@shared/constants/errorCodes';

/**
 * Controller handling authentication-related HTTP requests in the Pollen8 platform,
 * implementing phone verification and user authentication endpoints.
 */
export class AuthController {
  private authService: AuthService;
  private userValidator: UserValidator;

  constructor(authService: AuthService, userValidator: UserValidator) {
    this.authService = authService;
    this.userValidator = userValidator;
  }

  /**
   * Endpoint to initiate phone verification process
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response> - Express response object with verification status
   */
  async sendVerificationCode(req: Request, res: Response): Promise<Response> {
    try {
      // Extract phone number from request body
      const { phoneNumber } = req.body;

      // Validate phone number using UserValidator
      if (!this.userValidator.isValidPhoneNumber(phoneNumber)) {
        return formatResponse(res, 400, { error: AUTH_ERRORS.INVALID_PHONE_NUMBER });
      }

      // Call AuthService to send verification code
      const verificationId = await this.authService.sendVerificationCode(phoneNumber);

      // Format and return response with verification ID
      return formatResponse(res, 200, { verificationId });
    } catch (error) {
      console.error('Error in sendVerificationCode:', error);
      return formatResponse(res, 500, { error: 'Internal server error' });
    }
  }

  /**
   * Endpoint to verify SMS code and authenticate user
   * @param req - Express request object
   * @param res - Express response object
   * @returns Promise<Response> - Express response object with user data and token
   */
  async verifyCode(req: Request, res: Response): Promise<Response> {
    try {
      // Extract verification code and phone number from request body
      const { verificationId, code } = req.body;

      // Validate verification code format
      if (!this.userValidator.isValidVerificationCode(code)) {
        return formatResponse(res, 400, { error: AUTH_ERRORS.INVALID_VERIFICATION_CODE });
      }

      // Extract phone number from verificationId
      const phoneNumber = verificationId.split(':')[1];

      // Call AuthService to verify code and get user data
      const userData: UserResponse = await this.authService.verifyCode(phoneNumber, code);

      // Format and return response with user data and JWT token
      return formatResponse(res, 200, userData);
    } catch (error) {
      console.error('Error in verifyCode:', error);
      if (error instanceof Error && error.message === AUTH_ERRORS.INVALID_VERIFICATION_CODE) {
        return formatResponse(res, 400, { error: error.message });
      }
      return formatResponse(res, 500, { error: 'Internal server error' });
    }
  }
}

/**
 * @fileoverview This file implements the AuthController for the Pollen8 platform.
 * It addresses several key requirements:
 * 1. Verified Connections: Handles phone verification requests (Technical Specification/1.1 System Objectives)
 * 2. User-Centric Design: Provides smooth authentication flow (Technical Specification/1.1 System Objectives)
 * 3. Security Protocols: Implements secure authentication endpoints (Technical Specification/5. Security Considerations)
 */