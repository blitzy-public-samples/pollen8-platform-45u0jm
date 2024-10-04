import AWS from 'aws-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Interface for AWS configuration
interface AWSConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  s3: {
    bucket: string;
  };
}

// Function to validate required environment variables
const validateEnvVariables = (): void => {
  const requiredVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'S3_BUCKET_NAME'];
  for (const variable of requiredVars) {
    if (!process.env[variable]) {
      throw new Error(`Missing required environment variable: ${variable}`);
    }
  }
};

// Initialize AWS configuration
export const AWS_CONFIG: AWSConfig = {
  region: process.env.AWS_REGION!,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  s3: {
    bucket: process.env.S3_BUCKET_NAME!,
  },
};

// Initialize AWS SDK
export const initializeAWS = (): void => {
  validateEnvVariables();

  AWS.config.update({
    region: AWS_CONFIG.region,
    accessKeyId: AWS_CONFIG.accessKeyId,
    secretAccessKey: AWS_CONFIG.secretAccessKey,
  });

  console.log('AWS SDK initialized successfully');
};

// Create and configure S3 client
export const S3_CLIENT = new AWS.S3({
  apiVersion: '2006-03-01',
  params: { Bucket: AWS_CONFIG.s3.bucket },
});

// Function to get S3 bucket URL
export const getS3BucketUrl = (): string => {
  return `https://${AWS_CONFIG.s3.bucket}.s3.${AWS_CONFIG.region}.amazonaws.com`;
};

// Export initialized AWS and S3 client
export { AWS };

/**
 * This module manages the AWS configuration settings for the Pollen8 platform.
 * It provides a centralized location for AWS-related parameters and initialization.
 * 
 * Requirements addressed:
 * 1. Static Asset Storage (Technical Specification/2.2 HIGH-LEVEL ARCHITECTURE DIAGRAM)
 *    - Configures S3 for storing user-generated content
 * 2. Secure Configuration (Technical Specification/5. SECURITY CONSIDERATIONS)
 *    - Ensures secure handling of AWS credentials
 * 3. Cloud Services Integration (Technical Specification/6.2 CLOUD SERVICES)
 *    - Establishes connection to AWS services
 */