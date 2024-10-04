import { encrypt, decrypt } from '../../../src/utils/encryption';
import { AWS_CONFIG } from '../../../src/config/aws';
import { KMS } from 'aws-sdk';
import crypto from 'crypto';

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  KMS: jest.fn(() => ({
    generateDataKey: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Plaintext: Buffer.from('mockedKey') })
    })
  }))
}));

describe('Encryption Utility', () => {
  const mockKMSClient = new KMS();
  let mockEncryptedData: string;
  let mockDecryptedData: string;

  beforeAll(() => {
    // Configure AWS SDK mock
    process.env.AWS_KMS_KEY_ID = 'mock-kms-key-id';
    
    // Set up KMS mock responses
    (mockKMSClient.generateDataKey as jest.Mock).mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Plaintext: crypto.randomBytes(32) })
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
    delete process.env.AWS_KMS_KEY_ID;
  });

  test('should successfully encrypt data', async () => {
    // Prepare test data
    const testData = 'sensitive information';

    // Call encrypt function
    const encryptedResult = await encrypt(testData);

    // Verify encrypted result format
    expect(encryptedResult).toBeTruthy();
    expect(typeof encryptedResult).toBe('string');
    expect(encryptedResult).not.toEqual(testData);

    // Ensure result is different from input
    expect(encryptedResult).not.toBe(testData);

    // Store for decryption test
    mockEncryptedData = encryptedResult;
  });

  test('should successfully decrypt encrypted data', async () => {
    // Prepare encrypted test data
    const encryptedData = mockEncryptedData;

    // Call decrypt function
    const decryptedResult = await decrypt(encryptedData);

    // Verify decrypted result matches original
    expect(decryptedResult).toBe('sensitive information');

    // Store for future tests
    mockDecryptedData = decryptedResult;
  });

  test('should handle AWS KMS errors during encryption', async () => {
    // Mock AWS KMS error response
    (mockKMSClient.generateDataKey as jest.Mock).mockReturnValueOnce({
      promise: jest.fn().mockRejectedValue(new Error('KMS Service Error'))
    });

    // Attempt to encrypt data
    await expect(encrypt('test data')).rejects.toThrow('Failed to encrypt data');

    // Validate error message
    try {
      await encrypt('test data');
    } catch (error) {
      expect(error.message).toBe('Failed to encrypt data');
    }
  });

  test('should handle AWS KMS errors during decryption', async () => {
    // Mock AWS KMS error response
    (mockKMSClient.generateDataKey as jest.Mock).mockReturnValueOnce({
      promise: jest.fn().mockRejectedValue(new Error('KMS Service Error'))
    });

    // Attempt to decrypt data
    await expect(decrypt(mockEncryptedData)).rejects.toThrow('Failed to decrypt data');

    // Validate error message
    try {
      await decrypt(mockEncryptedData);
    } catch (error) {
      expect(error.message).toBe('Failed to decrypt data');
    }
  });

  test('should throw error when decrypting invalid data', async () => {
    const invalidEncryptedData = 'invalidData';

    await expect(decrypt(invalidEncryptedData)).rejects.toThrow('Failed to decrypt data');
  });

  test('should encrypt and decrypt data consistently', async () => {
    const originalData = 'test consistency';
    const encryptedData = await encrypt(originalData);
    const decryptedData = await decrypt(encryptedData);

    expect(decryptedData).toBe(originalData);
  });

  test('should generate unique ciphertexts for the same plaintext', async () => {
    const plaintext = 'same data';
    const firstEncryption = await encrypt(plaintext);
    const secondEncryption = await encrypt(plaintext);

    expect(firstEncryption).not.toBe(secondEncryption);
  });
});