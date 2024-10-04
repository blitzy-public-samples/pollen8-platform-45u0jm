import { LogLevel } from '../types/api.types';

/**
 * Enum representing the different deployment environments for the Pollen8 platform.
 * @enum {string}
 * @description Addresses the "Deployment Environment" requirement from Technical Specification/6.1 Deployment Environment.
 */
export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production'
}

/**
 * The current Node environment, defaulting to 'development' if not set.
 * @constant
 * @type {string}
 */
export const NODE_ENV: string = process.env.NODE_ENV || 'development';

/**
 * Interface defining the structure of environment-specific configuration.
 * @interface
 * @description Addresses the "Infrastructure" requirement from Technical Specification/2.2 High-Level Architecture Diagram.
 */
export interface EnvironmentConfig {
  apiUrl: string;
  wsUrl: string;
  logLevel: LogLevel;
  database: DatabaseConfig;
  redis: RedisConfig;
  sms: SMSConfig;
  aws: AWSConfig;
}

/**
 * Interface for database-specific configuration.
 * @interface
 */
interface DatabaseConfig {
  uri: string;
  poolSize: number;
  replicaSet?: string;
}

/**
 * Interface for Redis-specific configuration.
 * @interface
 */
interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

/**
 * Interface for SMS service configuration.
 * @interface
 */
interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

/**
 * Interface for AWS-specific configuration.
 * @interface
 */
interface AWSConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  s3Bucket: string;
}

/**
 * Environment-specific configurations for the Pollen8 platform.
 * @const
 * @type {Record<Environment, EnvironmentConfig>}
 * @description Addresses the "Deployment Environment" and "Security Considerations" requirements from Technical Specification.
 */
const environmentConfigs: Record<Environment, EnvironmentConfig> = {
  [Environment.Development]: {
    apiUrl: 'http://localhost:3000',
    wsUrl: 'ws://localhost:3001',
    logLevel: LogLevel.Debug,
    database: {
      uri: 'mongodb://localhost:27017/pollen8_dev',
      poolSize: 10
    },
    redis: {
      host: 'localhost',
      port: 6379
    },
    sms: {
      accountSid: 'AC_TEST_SID',
      authToken: 'TEST_AUTH_TOKEN',
      fromNumber: '+15555555555'
    },
    aws: {
      region: 'us-east-1',
      accessKeyId: 'DEV_ACCESS_KEY',
      secretAccessKey: 'DEV_SECRET_KEY',
      s3Bucket: 'pollen8-dev-bucket'
    }
  },
  [Environment.Staging]: {
    apiUrl: 'https://api-staging.pollen8.com',
    wsUrl: 'wss://ws-staging.pollen8.com',
    logLevel: LogLevel.Info,
    database: {
      uri: 'mongodb://pollen8-staging-cluster.mongodb.net/pollen8_staging',
      poolSize: 50,
      replicaSet: 'rs0'
    },
    redis: {
      host: 'pollen8-staging-redis.cache.amazonaws.com',
      port: 6379,
      password: process.env.REDIS_PASSWORD
    },
    sms: {
      accountSid: process.env.TWILIO_ACCOUNT_SID!,
      authToken: process.env.TWILIO_AUTH_TOKEN!,
      fromNumber: process.env.TWILIO_FROM_NUMBER!
    },
    aws: {
      region: 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      s3Bucket: 'pollen8-staging-bucket'
    }
  },
  [Environment.Production]: {
    apiUrl: 'https://api.pollen8.com',
    wsUrl: 'wss://ws.pollen8.com',
    logLevel: LogLevel.Error,
    database: {
      uri: 'mongodb://pollen8-prod-cluster.mongodb.net/pollen8_production',
      poolSize: 100,
      replicaSet: 'rs0'
    },
    redis: {
      host: 'pollen8-prod-redis.cache.amazonaws.com',
      port: 6379,
      password: process.env.REDIS_PASSWORD
    },
    sms: {
      accountSid: process.env.TWILIO_ACCOUNT_SID!,
      authToken: process.env.TWILIO_AUTH_TOKEN!,
      fromNumber: process.env.TWILIO_FROM_NUMBER!
    },
    aws: {
      region: 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      s3Bucket: 'pollen8-production-bucket'
    }
  }
};

/**
 * Retrieves the configuration object for the current environment.
 * @function
 * @returns {EnvironmentConfig} Configuration object for the current environment.
 * @throws {Error} If the current environment is not recognized.
 * @description Addresses the "Deployment Environment" requirement from Technical Specification/6.1 Deployment Environment.
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = NODE_ENV as Environment;
  const config = environmentConfigs[env];

  if (!config) {
    throw new Error(`Unsupported environment: ${env}`);
  }

  // Validate the configuration for completeness
  const requiredKeys: (keyof EnvironmentConfig)[] = ['apiUrl', 'wsUrl', 'logLevel', 'database', 'redis', 'sms', 'aws'];
  for (const key of requiredKeys) {
    if (!(key in config)) {
      throw new Error(`Missing required configuration key: ${key}`);
    }
  }

  return config;
}

/**
 * Export the environment configurations for use in other modules.
 * This allows for type-safe access to environment-specific configurations.
 */
export const ENVIRONMENTS = environmentConfigs;