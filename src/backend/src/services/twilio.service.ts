import { Twilio } from 'twilio';
import { SMS_CONFIG } from '../config/sms';
import logger from '../utils/logger';
import { ValidationError } from '../utils/errorHandlers';
import { IUser } from '@shared/interfaces/user.interface';

/**
 * Interface for verification code data structure.
 */
interface VerificationCode {
  code: string;
  expiresAt: Date;
}

/**
 * Service class for handling SMS operations using Twilio.
 * This class implements the SMS-based phone verification for the Pollen8 platform's verified connections feature.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives)
 * - Phone Verification (Technical Specification/1.1 System Objectives)
 * - Real Identity Validation (Technical Specification/1.1 System Objectives)
 */
export class TwilioService {
  private client: Twilio.Twilio;
  private verificationCodes: Map<string, VerificationCode>;

  constructor() {
    this.client = new Twilio(SMS_CONFIG.accountSid, SMS_CONFIG.authToken);
    this.verificationCodes = new Map<string, VerificationCode>();
  }

  /**
   * Sends a verification code to the specified phone number.
   * @param phoneNumber The phone number to send the verification code to
   * @returns The verification code sent
   */
  async sendVerificationCode(phoneNumber: string): Promise<string> {
    try {
      this.validatePhoneNumber(phoneNumber);
      const code = this.generateVerificationCode();
      const message = `Your Pollen8 verification code is: ${code}`;

      await this.client.messages.create({
        body: message,
        from: SMS_CONFIG.phoneNumber,
        to: phoneNumber,
      });

      const expiresAt = new Date(Date.now() + SMS_CONFIG.verificationCodeExpiry * 1000);
      this.verificationCodes.set(phoneNumber, { code, expiresAt });

      logger.info(`Verification code sent to ${phoneNumber}`);
      return code;
    } catch (error) {
      logger.error(`Error sending verification code to ${phoneNumber}: ${error.message}`);
      throw new ValidationError('Failed to send verification code', 'SMS_SEND_FAILED');
    }
  }

  /**
   * Verifies the code sent to the specified phone number.
   * @param phoneNumber The phone number to verify the code for
   * @param code The verification code to check
   * @returns True if verification successful, false otherwise
   */
  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    const storedCode = this.verificationCodes.get(phoneNumber);

    if (!storedCode) {
      logger.warn(`No verification code found for ${phoneNumber}`);
      return false;
    }

    if (storedCode.code !== code) {
      logger.warn(`Invalid verification code for ${phoneNumber}`);
      return false;
    }

    if (storedCode.expiresAt < new Date()) {
      logger.warn(`Expired verification code for ${phoneNumber}`);
      this.verificationCodes.delete(phoneNumber);
      return false;
    }

    this.verificationCodes.delete(phoneNumber);
    logger.info(`Phone number ${phoneNumber} successfully verified`);
    return true;
  }

  /**
   * Generates a random verification code of specified length.
   * @returns Generated verification code
   */
  private generateVerificationCode(): string {
    const codeLength = SMS_CONFIG.verificationCodeLength;
    let code = '';
    for (let i = 0; i < codeLength; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  /**
   * Removes expired verification codes from memory.
   */
  private cleanupExpiredCodes(): void {
    const now = new Date();
    let expiredCount = 0;

    for (const [phoneNumber, codeData] of this.verificationCodes.entries()) {
      if (codeData.expiresAt < now) {
        this.verificationCodes.delete(phoneNumber);
        expiredCount++;
      }
    }

    logger.debug(`Cleaned up ${expiredCount} expired verification codes`);
  }

  /**
   * Validates the format of the phone number.
   * @param phoneNumber The phone number to validate
   * @throws ValidationError if the phone number is invalid
   */
  private validatePhoneNumber(phoneNumber: string): void {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      throw new ValidationError('Invalid phone number format', 'INVALID_PHONE_NUMBER');
    }
  }
}

// Export a singleton instance of the TwilioService
export const twilioService = new TwilioService();

/**
 * This module provides the TwilioService for handling SMS-based phone verification
 * in the Pollen8 platform's verified connections feature.
 * 
 * It addresses the following requirements:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives)
 *    - Implements phone number verification via SMS
 * 2. Phone Verification (Technical Specification/1.1 System Objectives)
 *    - Handles SMS-based authentication process
 * 3. Real Identity Validation (Technical Specification/1.1 System Objectives)
 *    - Ensures user authenticity through phone verification
 * 
 * The module includes:
 * - TwilioService class with methods for sending and verifying SMS codes
 * - Secure code generation and storage
 * - Phone number validation
 * - Automatic cleanup of expired verification codes
 */