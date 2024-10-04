import { TwilioService } from '../../../src/services/twilio.service';
import { SMS_CONFIG } from '../../../src/config/sms';
import { ValidationError } from '../../../src/utils/errorHandlers';
import { IUser } from '@shared/interfaces/user.interface';
import { Twilio } from 'twilio';
import logger from '../../../src/utils/logger';

// Mock the twilio package
jest.mock('twilio');

// Mock the logger
jest.mock('../../../src/utils/logger');

describe('TwilioService', () => {
  let twilioService: TwilioService;
  let mockTwilioClient: jest.Mocked<Twilio.Twilio>;

  const validPhoneNumber = '+1234567890';
  const invalidPhoneNumber = '123456';
  const mockVerificationCode = '123456';

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a mock Twilio client
    mockTwilioClient = {
      messages: {
        create: jest.fn().mockResolvedValue({}),
      },
    } as unknown as jest.Mocked<Twilio.Twilio>;

    // Mock the Twilio constructor
    (Twilio as jest.MockedClass<typeof Twilio>).mockImplementation(() => mockTwilioClient);

    // Create a fresh instance of TwilioService for each test
    twilioService = new TwilioService();
  });

  describe('constructor', () => {
    it('should initialize TwilioService with correct configuration', () => {
      expect(Twilio).toHaveBeenCalledWith(SMS_CONFIG.accountSid, SMS_CONFIG.authToken);
      expect(twilioService['verificationCodes']).toBeInstanceOf(Map);
    });
  });

  describe('sendVerificationCode', () => {
    it('should send verification code successfully', async () => {
      const code = await twilioService.sendVerificationCode(validPhoneNumber);

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expect.stringContaining(code),
        from: SMS_CONFIG.phoneNumber,
        to: validPhoneNumber,
      });
      expect(twilioService['verificationCodes'].get(validPhoneNumber)).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith(`Verification code sent to ${validPhoneNumber}`);
    });

    it('should throw error for invalid phone number', async () => {
      await expect(twilioService.sendVerificationCode(invalidPhoneNumber)).rejects.toThrow(ValidationError);
      expect(mockTwilioClient.messages.create).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should generate unique codes for different numbers', async () => {
      const code1 = await twilioService.sendVerificationCode('+1234567890');
      const code2 = await twilioService.sendVerificationCode('+9876543210');

      expect(code1).not.toBe(code2);
      expect(twilioService['verificationCodes'].get('+1234567890')?.code).toBe(code1);
      expect(twilioService['verificationCodes'].get('+9876543210')?.code).toBe(code2);
    });
  });

  describe('verifyCode', () => {
    beforeEach(async () => {
      // Send a verification code before each test
      await twilioService.sendVerificationCode(validPhoneNumber);
    });

    it('should verify correct code successfully', async () => {
      const storedCode = twilioService['verificationCodes'].get(validPhoneNumber)?.code;
      const result = await twilioService.verifyCode(validPhoneNumber, storedCode!);

      expect(result).toBe(true);
      expect(twilioService['verificationCodes'].has(validPhoneNumber)).toBe(false);
      expect(logger.info).toHaveBeenCalledWith(`Phone number ${validPhoneNumber} successfully verified`);
    });

    it('should fail for incorrect code', async () => {
      const result = await twilioService.verifyCode(validPhoneNumber, 'wrong-code');

      expect(result).toBe(false);
      expect(twilioService['verificationCodes'].has(validPhoneNumber)).toBe(true);
      expect(logger.warn).toHaveBeenCalledWith(`Invalid verification code for ${validPhoneNumber}`);
    });

    it('should fail for expired code', async () => {
      // Manipulate the expiration time
      const storedCode = twilioService['verificationCodes'].get(validPhoneNumber);
      if (storedCode) {
        storedCode.expiresAt = new Date(Date.now() - 1000); // Set to 1 second ago
        twilioService['verificationCodes'].set(validPhoneNumber, storedCode);
      }

      const result = await twilioService.verifyCode(validPhoneNumber, storedCode!.code);

      expect(result).toBe(false);
      expect(twilioService['verificationCodes'].has(validPhoneNumber)).toBe(false);
      expect(logger.warn).toHaveBeenCalledWith(`Expired verification code for ${validPhoneNumber}`);
    });
  });

  // Additional tests for private methods
  describe('private methods', () => {
    it('should generate verification code of correct length', () => {
      const code = twilioService['generateVerificationCode']();
      expect(code.length).toBe(SMS_CONFIG.verificationCodeLength);
      expect(/^\d+$/.test(code)).toBe(true);
    });

    it('should validate phone number correctly', () => {
      expect(() => twilioService['validatePhoneNumber'](validPhoneNumber)).not.toThrow();
      expect(() => twilioService['validatePhoneNumber'](invalidPhoneNumber)).toThrow(ValidationError);
    });

    it('should clean up expired codes', () => {
      const expiredNumber = '+1111111111';
      const validNumber = '+2222222222';

      twilioService['verificationCodes'].set(expiredNumber, {
        code: '123456',
        expiresAt: new Date(Date.now() - 1000),
      });
      twilioService['verificationCodes'].set(validNumber, {
        code: '654321',
        expiresAt: new Date(Date.now() + 1000000),
      });

      twilioService['cleanupExpiredCodes']();

      expect(twilioService['verificationCodes'].has(expiredNumber)).toBe(false);
      expect(twilioService['verificationCodes'].has(validNumber)).toBe(true);
      expect(logger.debug).toHaveBeenCalledWith('Cleaned up 1 expired verification codes');
    });
  });
});