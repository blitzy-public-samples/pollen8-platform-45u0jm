import request from 'supertest';
import { createApp } from '../../src/app';
import { IUser } from '@shared/interfaces/user.interface';
import { AuthErrors } from '@shared/constants/errorCodes';
import { closeDatabase, connectDatabase } from '../../src/config/database';
import { clearTestData } from '../utils/testHelpers';

/**
 * Integration test suite for authentication endpoints in the Pollen8 platform,
 * ensuring proper functionality of phone verification and user authentication flows.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives): Test phone verification process
 * - User-Centric Design (Technical Specification/1.1 System Objectives): Validate authentication flow
 * - Security Protocols (Technical Specification/5. Security Considerations): Verify secure authentication implementation
 */

describe('Authentication Endpoints', () => {
  let app: Express.Application;

  beforeAll(async () => {
    app = createApp();
    await connectDatabase();
  });

  afterAll(async () => {
    await clearTestData();
    await closeDatabase();
  });

  describe('Phone Verification Endpoint', () => {
    const verifyEndpoint = '/api/auth/verify';

    it('should send verification code successfully', async () => {
      const response = await request(app)
        .post(verifyEndpoint)
        .send({ phoneNumber: '+1234567890' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('verificationId');
    });

    it('should return 400 for invalid phone number', async () => {
      const response = await request(app)
        .post(verifyEndpoint)
        .send({ phoneNumber: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe(AuthErrors.INVALID_PHONE);
    });

    it('should handle rate limiting', async () => {
      const attempts = 6; // Assuming rate limit is set to 5 requests per minute
      const responses = await Promise.all(
        Array(attempts).fill(null).map(() =>
          request(app)
            .post(verifyEndpoint)
            .send({ phoneNumber: '+1987654321' })
        )
      );

      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
    });
  });

  describe('Code Verification Endpoint', () => {
    const confirmEndpoint = '/api/auth/confirm';

    it('should verify code and return user token', async () => {
      // First, request a verification code
      const verifyResponse = await request(app)
        .post('/api/auth/verify')
        .send({ phoneNumber: '+1122334455' });

      expect(verifyResponse.status).toBe(200);
      const { verificationId } = verifyResponse.body;

      // Now, confirm the code (using a mock code for testing)
      const confirmResponse = await request(app)
        .post(confirmEndpoint)
        .send({ verificationId, code: '123456' });

      expect(confirmResponse.status).toBe(200);
      expect(confirmResponse.body).toHaveProperty('token');
      expect(confirmResponse.body).toHaveProperty('user');
      expect(confirmResponse.body.user).toHaveProperty('phoneNumber', '+1122334455');
    });

    it('should return 400 for invalid code', async () => {
      const response = await request(app)
        .post(confirmEndpoint)
        .send({ verificationId: 'invalid', code: '000000' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe(AuthErrors.VERIFICATION_FAILED);
    });

    it('should return 400 for expired code', async () => {
      // This test assumes that the verification code expires after a certain time
      // We'll need to mock the expiration for this test
      jest.useFakeTimers();
      
      const verifyResponse = await request(app)
        .post('/api/auth/verify')
        .send({ phoneNumber: '+1987654321' });

      expect(verifyResponse.status).toBe(200);
      const { verificationId } = verifyResponse.body;

      // Fast-forward time to simulate expiration
      jest.advanceTimersByTime(15 * 60 * 1000); // Assuming 15 minutes expiration

      const confirmResponse = await request(app)
        .post(confirmEndpoint)
        .send({ verificationId, code: '123456' });

      expect(confirmResponse.status).toBe(400);
      expect(confirmResponse.body).toHaveProperty('error');
      expect(confirmResponse.body.error).toBe(AuthErrors.VERIFICATION_FAILED);

      jest.useRealTimers();
    });
  });
});

/**
 * This test suite covers the core functionality of the authentication process in the Pollen8 platform.
 * It tests both the phone verification initiation and the code confirmation steps.
 * 
 * Key aspects tested:
 * 1. Successful phone verification request
 * 2. Handling of invalid phone numbers
 * 3. Rate limiting for verification requests
 * 4. Successful code confirmation and token issuance
 * 5. Handling of invalid verification codes
 * 6. Handling of expired verification codes
 * 
 * These tests ensure that the authentication flow is secure, handles errors appropriately,
 * and provides a smooth user experience in line with the platform's objectives.
 */