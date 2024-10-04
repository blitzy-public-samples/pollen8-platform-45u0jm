import { IUser, IUserCreate, UserResponse } from '@shared/interfaces/user.interface';
import { UserRole } from '@shared/enums/userRole.enum';
import { AUTH_ERRORS } from '@shared/constants/errorCodes';
import { UserRepository } from '@database/repositories/user.repository';
import { Twilio } from 'twilio';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Redis } from 'ioredis';

/**
 * Authentication service that handles user verification, token management,
 * and authentication-related operations for the Pollen8 platform.
 */
export class AuthService {
  private userRepository: UserRepository;
  private twilioClient: Twilio.Twilio;
  private redisClient: Redis;

  constructor(
    userRepository: UserRepository,
    twilioClient: Twilio.Twilio,
    redisClient: Redis
  ) {
    this.userRepository = userRepository;
    this.twilioClient = twilioClient;
    this.redisClient = redisClient;
  }

  /**
   * Sends a verification code to the provided phone number.
   * @param phoneNumber - The phone number to send the verification code to.
   * @returns A Promise resolving to the verification ID for the sent code.
   */
  async sendVerificationCode(phoneNumber: string): Promise<string> {
    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error(AUTH_ERRORS.INVALID_PHONE_NUMBER);
    }

    // Generate 6-digit verification code
    const verificationCode = this.generateVerificationCode();

    // Store code in Redis cache with expiration
    const verificationId = `verify:${phoneNumber}`;
    await this.redisClient.set(verificationId, verificationCode, 'EX', 300); // 5 minutes expiration

    // Send SMS via Twilio service
    await this.twilioClient.messages.create({
      body: `Your Pollen8 verification code is: ${verificationCode}`,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    return verificationId;
  }

  /**
   * Verifies the SMS code and creates or retrieves a user account.
   * @param phoneNumber - The phone number to verify.
   * @param code - The verification code to check.
   * @returns A Promise resolving to the user data and authentication token.
   */
  async verifyCode(phoneNumber: string, code: string): Promise<UserResponse> {
    const verificationId = `verify:${phoneNumber}`;

    // Retrieve stored code from Redis
    const storedCode = await this.redisClient.get(verificationId);

    // Validate code matches and hasn't expired
    if (!storedCode || storedCode !== code) {
      throw new Error(AUTH_ERRORS.INVALID_VERIFICATION_CODE);
    }

    // Find or create user account
    let user = await this.userRepository.findByPhoneNumber(phoneNumber);
    if (!user) {
      const newUser: IUserCreate = {
        phoneNumber,
        industries: [],
        interests: [],
        location: { city: '', zipCode: '' },
      };
      user = await this.userRepository.create(newUser);
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Delete the verification code from Redis
    await this.redisClient.del(verificationId);

    return { user, token };
  }

  /**
   * Generates a JWT token for authenticated user.
   * @param user - The user object to generate the token for.
   * @returns A JWT token containing user data.
   */
  private generateToken(user: IUser): string {
    const payload = {
      id: user._id,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };

    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRY || '24h',
    });
  }

  /**
   * Validates a JWT token and returns the associated user.
   * @param token - The JWT token to validate.
   * @returns A Promise resolving to the user data from the validated token.
   */
  async validateToken(token: string): Promise<IUser> {
    try {
      // Verify token signature
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

      // Check token expiration
      if (!decoded || !decoded.id) {
        throw new Error(AUTH_ERRORS.INVALID_TOKEN);
      }

      // Extract user ID from token
      const userId = decoded.id;

      // Retrieve and return user data
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error(AUTH_ERRORS.USER_NOT_FOUND);
      }

      return user;
    } catch (error) {
      throw new Error(AUTH_ERRORS.INVALID_TOKEN);
    }
  }

  /**
   * Validates the format of a phone number.
   * @param phoneNumber - The phone number to validate.
   * @returns A boolean indicating whether the phone number is valid.
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Implement phone number validation logic
    // This is a simple example and should be replaced with a more robust validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Generates a random 6-digit verification code.
   * @returns A string representing the 6-digit verification code.
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

/**
 * @fileoverview This file implements the AuthService for the Pollen8 platform.
 * It addresses several key requirements:
 * 1. Verified Connections: Implements phone number verification (Technical Specification/1.1 System Objectives)
 * 2. User-Centric Design: Handles authentication flows smoothly (Technical Specification/1.1 System Objectives)
 * 3. Security Protocols: Manages secure token generation and validation (Technical Specification/5. Security Considerations)
 */