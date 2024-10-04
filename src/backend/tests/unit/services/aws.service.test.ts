import { S3 } from 'aws-sdk';
import AWSMock from 'aws-sdk-mock';
import { AWSService } from '../../../src/services/aws.service';
import { AWS_CONFIG } from '../../../src/config/aws';
import logger from '../../../src/utils/logger';
import { allowedFileTypes } from '../../../src/config/constants';

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('AWSService', () => {
  let awsService: AWSService;
  const mockS3Client = {} as S3;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    AWSMock.restore();

    // Create new instance of AWSService with mock dependencies
    awsService = new AWSService(mockS3Client, logger);
  });

  afterEach(() => {
    // Restore all AWS SDK mocks
    AWSMock.restore();
  });

  // Helper function to create a test file buffer
  const createTestFile = (size: number): Buffer => {
    return Buffer.alloc(size, 'test data');
  };

  describe('uploadFile', () => {
    it('should successfully upload a file', async () => {
      // Mock S3 upload method
      AWSMock.mock('S3', 'upload', (params: S3.PutObjectRequest, callback: Function) => {
        callback(null, { Location: 'https://test-bucket.s3.amazonaws.com/test-file' });
      });

      const testFile = createTestFile(1024);
      const result = await awsService.uploadFile(testFile, 'test-file', 'image/jpeg');

      expect(result).toMatch(/^https:\/\/.*\/test-file$/);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('File uploaded successfully'));
    });

    it('should throw an error when upload fails', async () => {
      AWSMock.mock('S3', 'upload', (params: S3.PutObjectRequest, callback: Function) => {
        callback(new Error('Upload failed'), null);
      });

      const testFile = createTestFile(1024);
      await expect(awsService.uploadFile(testFile, 'test-file', 'image/jpeg')).rejects.toThrow('Failed to upload file');
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error uploading file to S3'));
    });

    it('should validate file type before upload', async () => {
      const testFile = createTestFile(1024);
      await expect(awsService.uploadFile(testFile, 'test-file', 'application/exe')).rejects.toThrow('File type not allowed');
    });

    it('should handle retry on network error', async () => {
      let attempts = 0;
      AWSMock.mock('S3', 'upload', (params: S3.PutObjectRequest, callback: Function) => {
        if (attempts === 0) {
          attempts++;
          callback(new Error('Network error'), null);
        } else {
          callback(null, { Location: 'https://test-bucket.s3.amazonaws.com/test-file' });
        }
      });

      const testFile = createTestFile(1024);
      const result = await awsService.uploadFile(testFile, 'test-file', 'image/jpeg');

      expect(result).toMatch(/^https:\/\/.*\/test-file$/);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('File uploaded successfully'));
    });
  });

  describe('deleteFile', () => {
    it('should successfully delete a file', async () => {
      AWSMock.mock('S3', 'deleteObject', (params: S3.DeleteObjectRequest, callback: Function) => {
        callback(null, {});
      });

      await awsService.deleteFile('test-file');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('File deleted successfully'));
    });

    it('should throw an error when delete fails', async () => {
      AWSMock.mock('S3', 'deleteObject', (params: S3.DeleteObjectRequest, callback: Function) => {
        callback(new Error('Delete failed'), null);
      });

      await expect(awsService.deleteFile('test-file')).rejects.toThrow('Failed to delete file');
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error deleting file from S3'));
    });

    it('should handle non-existent file deletion', async () => {
      AWSMock.mock('S3', 'deleteObject', (params: S3.DeleteObjectRequest, callback: Function) => {
        callback(null, {});
      });

      await awsService.deleteFile('non-existent-file');
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('File deleted successfully'));
    });
  });

  describe('getSignedUrl', () => {
    it('should generate a valid signed URL', () => {
      const mockSignedUrl = 'https://test-bucket.s3.amazonaws.com/test-file?AWSAccessKeyId=xxx&Expires=xxx&Signature=xxx';
      AWSMock.mock('S3', 'getSignedUrl', (operation: string, params: S3.GetSignedUrlRequest, callback: Function) => {
        callback(null, mockSignedUrl);
      });

      const result = awsService.getSignedUrl('test-file', 3600);
      expect(result).toBe(mockSignedUrl);
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Signed URL generated for key'));
    });

    it('should handle invalid keys', () => {
      AWSMock.mock('S3', 'getSignedUrl', (operation: string, params: S3.GetSignedUrlRequest, callback: Function) => {
        callback(new Error('Invalid key'), null);
      });

      expect(() => awsService.getSignedUrl('invalid-key', 3600)).toThrow('Failed to generate signed URL');
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('Error generating signed URL'));
    });

    it('should respect expiration time parameter', () => {
      const mockSignedUrl = 'https://test-bucket.s3.amazonaws.com/test-file?AWSAccessKeyId=xxx&Expires=xxx&Signature=xxx';
      AWSMock.mock('S3', 'getSignedUrl', (operation: string, params: S3.GetSignedUrlRequest, callback: Function) => {
        expect(params.Expires).toBe(1800);
        callback(null, mockSignedUrl);
      });

      awsService.getSignedUrl('test-file', 1800);
    });
  });

  // Additional tests for error scenarios and edge cases
  describe('Error handling', () => {
    it('should handle network failures', async () => {
      AWSMock.mock('S3', 'upload', (params: S3.PutObjectRequest, callback: Function) => {
        callback(new Error('Network failure'), null);
      });

      const testFile = createTestFile(1024);
      await expect(awsService.uploadFile(testFile, 'test-file', 'image/jpeg')).rejects.toThrow('Failed to upload file');
    });

    it('should handle invalid input for file upload', async () => {
      const invalidFile = 'not a buffer' as unknown as Buffer;
      await expect(awsService.uploadFile(invalidFile, 'test-file', 'image/jpeg')).rejects.toThrow();
    });

    it('should handle timeouts', async () => {
      jest.useFakeTimers();
      AWSMock.mock('S3', 'upload', (params: S3.PutObjectRequest, callback: Function) => {
        setTimeout(() => callback(new Error('Timeout'), null), 10000);
      });

      const testFile = createTestFile(1024);
      const uploadPromise = awsService.uploadFile(testFile, 'test-file', 'image/jpeg');
      jest.advanceTimersByTime(11000);
      await expect(uploadPromise).rejects.toThrow('Failed to upload file');

      jest.useRealTimers();
    });
  });
});