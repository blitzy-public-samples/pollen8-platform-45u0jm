import { AWSService } from '@services/aws.service';
import { GoogleMapsService } from '@services/googleMaps.service';
import { TwilioService } from '@services/twilio.service';
import { AWS_CONFIG } from '@config/aws';
import { geolocationConfig } from '@config/geolocation';
import { SMS_CONFIG } from '@config/sms';
import { S3 } from 'aws-sdk';
import nock from 'nock';
import { mockClient } from 'aws-sdk-mock';
import Redis from 'ioredis';
import { LocationRepository } from '../../src/repositories/location.repository';

// Mock Redis client
jest.mock('ioredis');

describe('External Services Integration Tests', () => {
  let awsService: AWSService;
  let googleMapsService: GoogleMapsService;
  let twilioService: TwilioService;
  let mockS3: jest.Mocked<S3>;
  let mockRedis: jest.Mocked<Redis>;
  let mockLocationRepository: jest.Mocked<LocationRepository>;

  beforeAll(() => {
    // Initialize services with mock configurations
    mockS3 = new S3() as jest.Mocked<S3>;
    mockRedis = new Redis() as jest.Mocked<Redis>;
    mockLocationRepository = {
      create: jest.fn(),
      findNearby: jest.fn(),
    } as unknown as jest.Mocked<LocationRepository>;

    awsService = new AWSService(mockS3);
    googleMapsService = new GoogleMapsService(mockLocationRepository, mockRedis);
    twilioService = new TwilioService();

    // Set up mock implementations for external services
    mockClient(S3, 'upload', (params: S3.PutObjectRequest, callback: Function) => {
      callback(null, { Location: `https://${params.Bucket}.s3.amazonaws.com/${params.Key}` });
    });

    mockClient(S3, 'deleteObject', (params: S3.DeleteObjectRequest, callback: Function) => {
      callback(null, {});
    });

    mockClient(S3, 'getSignedUrl', (operation: string, params: S3.GetSignedUrlRequest, callback: Function) => {
      callback(null, `https://${params.Bucket}.s3.amazonaws.com/${params.Key}?signed=true`);
    });

    nock('https://maps.googleapis.com')
      .persist()
      .get('/maps/api/geocode/json')
      .query(true)
      .reply(200, {
        status: 'OK',
        results: [
          {
            address_components: [
              { long_name: 'New York', types: ['locality'] },
            ],
            geometry: {
              location: { lat: 40.7128, lng: -74.0060 },
            },
          },
        ],
      });

    jest.spyOn(twilioService['client'].messages, 'create').mockResolvedValue({} as any);
  });

  afterAll(() => {
    nock.cleanAll();
    mockClient.restore();
  });

  describe('AWS Service Integration', () => {
    const testFile = Buffer.from('Test file content');
    const testContentType = 'text/plain';

    it('should upload file to S3 successfully', async () => {
      const result = await awsService.uploadFile(testFile, 'test-file.txt', testContentType);
      expect(result).toMatch(/^https:\/\/.*\.s3\..*\.amazonaws\.com\/.*$/);
    });

    it('should handle upload failures gracefully', async () => {
      mockClient(S3, 'upload', (params: S3.PutObjectRequest, callback: Function) => {
        callback(new Error('Upload failed'), null);
      });

      await expect(awsService.uploadFile(testFile, 'test-file.txt', testContentType)).rejects.toThrow('Failed to upload file');
    });

    it('should generate correct signed URLs', () => {
      const signedUrl = awsService.getSignedUrl('test-file.txt', 3600);
      expect(signedUrl).toMatch(/^https:\/\/.*\.s3\..*\.amazonaws\.com\/.*\?signed=true$/);
    });

    it('should delete files from S3 successfully', async () => {
      await expect(awsService.deleteFile('test-file.txt')).resolves.not.toThrow();
    });
  });

  describe('Google Maps Service Integration', () => {
    const testZipCode = '10001';
    const testCoordinates = { latitude: 40.7128, longitude: -74.0060 };

    it('should validate and geocode ZIP code correctly', async () => {
      const result = await googleMapsService.validateAndGeocodeZipCode(testZipCode);
      expect(result).toEqual({
        zipCode: testZipCode,
        city: 'New York',
        coordinates: testCoordinates,
      });
    });

    it('should handle invalid ZIP codes appropriately', async () => {
      nock('https://maps.googleapis.com')
        .get('/maps/api/geocode/json')
        .query(true)
        .reply(200, { status: 'ZERO_RESULTS' });

      await expect(googleMapsService.validateAndGeocodeZipCode('00000')).rejects.toThrow('Geocoding failed: ZERO_RESULTS');
    });

    it('should find nearby locations within radius', async () => {
      mockLocationRepository.findNearby.mockResolvedValue([
        { zipCode: '10002', city: 'New York', coordinates: { latitude: 40.7138, longitude: -74.0070 } },
      ]);

      const result = await googleMapsService.findNearbyLocations(testCoordinates, 5000);
      expect(result).toHaveLength(1);
      expect(result[0].zipCode).toBe('10002');
    });

    it('should handle Google Maps API errors gracefully', async () => {
      nock('https://maps.googleapis.com')
        .get('/maps/api/geocode/json')
        .query(true)
        .replyWithError('API Error');

      await expect(googleMapsService.validateAndGeocodeZipCode(testZipCode)).rejects.toThrow('No response received from Google Maps API');
    });
  });

  describe('Twilio Service Integration', () => {
    const testPhoneNumber = '+12345678900';
    const testVerificationCode = '123456';

    it('should send verification code successfully', async () => {
      const result = await twilioService.sendVerificationCode(testPhoneNumber);
      expect(result).toHaveLength(SMS_CONFIG.verificationCodeLength);
    });

    it('should verify correct code', async () => {
      await twilioService.sendVerificationCode(testPhoneNumber);
      const verificationResult = await twilioService.verifyCode(testPhoneNumber, testVerificationCode);
      expect(verificationResult).toBe(true);
    });

    it('should reject incorrect verification code', async () => {
      await twilioService.sendVerificationCode(testPhoneNumber);
      const verificationResult = await twilioService.verifyCode(testPhoneNumber, 'wrong-code');
      expect(verificationResult).toBe(false);
    });

    it('should handle SMS sending failures appropriately', async () => {
      jest.spyOn(twilioService['client'].messages, 'create').mockRejectedValue(new Error('SMS sending failed'));
      await expect(twilioService.sendVerificationCode(testPhoneNumber)).rejects.toThrow('Failed to send verification code');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle AWS S3 network timeout', async () => {
      mockClient(S3, 'upload', (params: S3.PutObjectRequest, callback: Function) => {
        setTimeout(() => callback(new Error('Network timeout'), null), 1000);
      });

      await expect(awsService.uploadFile(Buffer.from('test'), 'test.txt', 'text/plain')).rejects.toThrow('Failed to upload file');
    });

    it('should handle Google Maps invalid API key', async () => {
      nock('https://maps.googleapis.com')
        .get('/maps/api/geocode/json')
        .query(true)
        .reply(403, { error_message: 'Invalid API key' });

      await expect(googleMapsService.validateAndGeocodeZipCode('10001')).rejects.toThrow('Google Maps API error: Invalid API key');
    });

    it('should handle Twilio rate limit exceeded', async () => {
      jest.spyOn(twilioService['client'].messages, 'create').mockRejectedValue(new Error('Rate limit exceeded'));
      await expect(twilioService.sendVerificationCode('+12345678900')).rejects.toThrow('Failed to send verification code');
    });
  });
});

/**
 * This integration test suite covers external service integrations in the Pollen8 platform,
 * including AWS S3, Google Maps API, and Twilio SMS services.
 * 
 * Requirements addressed:
 * 1. External Service Testing (Technical Specification/4.4 Third-Party Services)
 *    - Ensures reliable integration with third-party services
 * 2. Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 *    - Tests SMS verification functionality
 * 3. Location Validation (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 *    - Verifies geolocation service integration
 * 4. Static Asset Management (Technical Specification/2.2 HIGH-LEVEL ARCHITECTURE DIAGRAM)
 *    - Tests AWS S3 integration for file handling
 * 
 * The test suite includes:
 * - AWS S3 operations (upload, delete, signed URL generation)
 * - Google Maps API integration (geocoding, nearby location search)
 * - Twilio SMS service (sending and verifying codes)
 * - Error handling for various scenarios
 * 
 * Note: This test suite uses mocking to avoid actual API calls during testing.
 */