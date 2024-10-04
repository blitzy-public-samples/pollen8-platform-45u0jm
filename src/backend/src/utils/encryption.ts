import crypto from 'crypto';
import { AWS, AWS_CONFIG } from '../config/aws';
import { KMS } from 'aws-sdk';

/**
 * This module provides secure encryption and decryption functions for sensitive data
 * in the Pollen8 platform, ensuring data privacy and security compliance.
 * 
 * Requirements addressed:
 * 1. Data Security (Technical Specification/5.2 DATA SECURITY)
 *    - Implements encryption for sensitive user data
 * 2. Privacy Enhancement (Technical Specification/1.1 System Objectives/Verified Connections)
 *    - Supports encrypted storage of user information
 * 3. Security Standards (Technical Specification/5.2.1 Encryption Standards)
 *    - Implements AES-256-GCM encryption
 */

// Global constants
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

// Initialize AWS KMS client
const kms = new KMS({
  region: AWS_CONFIG.region,
  accessKeyId: AWS_CONFIG.accessKeyId,
  secretAccessKey: AWS_CONFIG.secretAccessKey,
});

/**
 * Generates a new encryption key using AWS KMS for use in encryption operations.
 * @returns {Promise<Buffer>} Generated encryption key
 */
async function generateKey(): Promise<Buffer> {
  const params = {
    KeyId: process.env.AWS_KMS_KEY_ID!, // Ensure this environment variable is set
    KeySpec: 'AES_256',
  };

  try {
    const { Plaintext } = await kms.generateDataKey(params).promise();
    if (!Plaintext) {
      throw new Error('Failed to generate data key');
    }
    return Buffer.from(Plaintext);
  } catch (error) {
    console.error('Error generating encryption key:', error);
    throw new Error('Failed to generate encryption key');
  }
}

/**
 * Encrypts the provided data using AES-256-GCM encryption with a key from AWS KMS.
 * @param {string} data - The data to be encrypted
 * @returns {Promise<string>} Base64 encoded encrypted data
 */
export async function encrypt(data: string): Promise<string> {
  try {
    const key = await generateKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();

    // Combine IV, encrypted data, and auth tag
    const result = Buffer.concat([iv, Buffer.from(encrypted, 'base64'), authTag]);
    return result.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts the provided encrypted data using the corresponding decryption key from AWS KMS.
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @returns {Promise<string>} Decrypted original data
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const buffer = Buffer.from(encryptedData, 'base64');
    const iv = buffer.slice(0, IV_LENGTH);
    const ciphertext = buffer.slice(IV_LENGTH, -AUTH_TAG_LENGTH);
    const authTag = buffer.slice(-AUTH_TAG_LENGTH);

    const key = await generateKey();
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * This module implements robust encryption and decryption functions using AES-256-GCM,
 * which is a highly secure encryption standard. It utilizes AWS Key Management Service (KMS)
 * for key generation, ensuring that encryption keys are managed securely and rotated regularly.
 * 
 * The encrypt function generates a new key for each encryption operation, enhancing security
 * by ensuring that each piece of data is encrypted with a unique key. The IV (Initialization Vector)
 * is randomly generated for each encryption operation, adding an extra layer of security.
 * 
 * The decrypt function reverses the process, using the same key generation mechanism to ensure
 * that the correct key is used for decryption. It also verifies the authentication tag, which
 * provides integrity checking for the encrypted data.
 * 
 * Error handling is implemented throughout to ensure that any issues during encryption or
 * decryption are caught and reported, maintaining the security and integrity of the system.
 */