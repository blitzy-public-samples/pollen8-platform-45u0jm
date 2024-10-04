import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { AWS_CONFIG, S3_CLIENT } from '../config/aws';
import logger from '../utils/logger';
import { allowedFileTypes } from '../config/constants';

/**
 * AWSService class encapsulates AWS operations, primarily focusing on S3 functionality.
 * It provides methods for uploading, deleting, and generating signed URLs for S3 objects.
 * 
 * Requirements addressed:
 * 1. Static Asset Storage (Technical Specification/2.2 HIGH-LEVEL ARCHITECTURE DIAGRAM)
 *    - Implements S3 storage for user-generated content
 * 2. Cloud Services Integration (Technical Specification/6.2 CLOUD SERVICES)
 *    - Provides AWS service functionality
 * 3. Secure File Handling (Technical Specification/5. SECURITY CONSIDERATIONS)
 *    - Ensures secure upload and retrieval of assets
 */
export class AWSService {
  private s3Client: S3;
  private logger: typeof logger;

  constructor(s3Client: S3 = S3_CLIENT, loggerInstance: typeof logger = logger) {
    this.s3Client = s3Client;
    this.logger = loggerInstance;
  }

  /**
   * Uploads a file to S3 and returns the URL of the uploaded file.
   * 
   * @param {Buffer} file - The file buffer to upload
   * @param {string} key - The key (path) for the file in S3 (optional)
   * @param {string} contentType - The MIME type of the file
   * @returns {Promise<string>} The URL of the uploaded file
   * @throws {Error} If the file type is not allowed or if the upload fails
   */
  async uploadFile(file: Buffer, key?: string, contentType: string): Promise<string> {
    // Validate file type
    if (!this.isAllowedFileType(contentType)) {
      throw new Error('File type not allowed');
    }

    // Generate a unique key if not provided
    const fileKey = key || `${uuidv4()}-${Date.now()}`;

    const params: S3.PutObjectRequest = {
      Bucket: AWS_CONFIG.s3.bucket,
      Key: fileKey,
      Body: file,
      ContentType: contentType,
    };

    try {
      await this.s3Client.upload(params).promise();
      const fileUrl = `https://${AWS_CONFIG.s3.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com/${fileKey}`;
      this.logger.info(`File uploaded successfully: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error}`);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Deletes a file from S3 using the provided key.
   * 
   * @param {string} key - The key of the file to delete
   * @returns {Promise<void>}
   * @throws {Error} If the deletion fails
   */
  async deleteFile(key: string): Promise<void> {
    const params: S3.DeleteObjectRequest = {
      Bucket: AWS_CONFIG.s3.bucket,
      Key: key,
    };

    try {
      await this.s3Client.deleteObject(params).promise();
      this.logger.info(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting file from S3: ${error}`);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Generates a signed URL for temporary access to a private S3 object.
   * 
   * @param {string} key - The key of the file in S3
   * @param {number} expirationInSeconds - The expiration time for the URL in seconds
   * @returns {string} The signed URL for temporary access
   * @throws {Error} If the URL generation fails
   */
  getSignedUrl(key: string, expirationInSeconds: number): string {
    const params: S3.GetSignedUrlRequest = {
      Bucket: AWS_CONFIG.s3.bucket,
      Key: key,
      Expires: expirationInSeconds,
    };

    try {
      const signedUrl = this.s3Client.getSignedUrl('getObject', params);
      this.logger.info(`Signed URL generated for key: ${key}`);
      return signedUrl;
    } catch (error) {
      this.logger.error(`Error generating signed URL: ${error}`);
      throw new Error('Failed to generate signed URL');
    }
  }

  /**
   * Checks if the given content type is allowed for upload.
   * 
   * @param {string} contentType - The MIME type of the file
   * @returns {boolean} True if the file type is allowed, false otherwise
   */
  private isAllowedFileType(contentType: string): boolean {
    return allowedFileTypes.includes(contentType);
  }
}

export default AWSService;