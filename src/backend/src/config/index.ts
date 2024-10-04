import dotenv from 'dotenv';
import { AWS_CONFIG, initializeAWS } from './aws';
import { createConnection as createDatabaseConnection } from './database';
import { REDIS_CONFIG } from './redis';
import SMS_CONFIG from './sms';
import geolocationConfig from './geolocation';

// Load environment variables
dotenv.config();

// Define global configuration types
interface GlobalConfig {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  CORS_ORIGINS: string[];
}

// Load and validate environment variables
const loadEnvironment = (): GlobalConfig => {
  const requiredEnvVars = ['NODE_ENV', 'PORT', 'API_VERSION', 'CORS_ORIGINS'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    NODE_ENV: process.env.NODE_ENV as string,
    PORT: parseInt(process.env.PORT as string, 10),
    API_VERSION: process.env.API_VERSION as string,
    CORS_ORIGINS: (process.env.CORS_ORIGINS as string).split(','),
  };
};

// Validate configuration settings
const validateConfig = (): void => {
  // Validate global config
  const globalConfig = loadEnvironment();
  if (isNaN(globalConfig.PORT) || globalConfig.PORT <= 0) {
    throw new Error('Invalid PORT configuration');
  }

  // Validate AWS config
  initializeAWS();

  // Validate database config
  createDatabaseConnection().catch((error) => {
    throw new Error(`Database connection error: ${error.message}`);
  });

  // Validate Redis config
  if (!REDIS_CONFIG.host || !REDIS_CONFIG.port) {
    throw new Error('Invalid Redis configuration');
  }

  // Validate SMS config
  if (!SMS_CONFIG.accountSid || !SMS_CONFIG.authToken || !SMS_CONFIG.phoneNumber) {
    throw new Error('Invalid SMS configuration');
  }

  // Validate geolocation config
  if (!geolocationConfig.apiKey) {
    throw new Error('Invalid geolocation configuration');
  }
};

// Export configuration
export const config = {
  ...loadEnvironment(),
  AWS_CONFIG,
  DATABASE_CONFIG: {
    createConnection: createDatabaseConnection,
  },
  REDIS_CONFIG,
  SMS_CONFIG,
  GEOLOCATION_CONFIG: geolocationConfig,
};

// Initialize and validate configuration
validateConfig();

/**
 * This module serves as the central configuration hub for the Pollen8 platform's backend service.
 * It aggregates and exports all configuration settings, ensuring a single entry point for all backend configurations.
 * 
 * Requirements addressed:
 * 1. Centralized Configuration (Technical Specification/2.2 HIGH-LEVEL ARCHITECTURE DIAGRAM)
 *    - Provides a single entry point for all backend configurations
 * 2. Environment-based Config (Technical Specification/6.1 DEPLOYMENT ENVIRONMENT)
 *    - Supports different configurations for development, staging, and production
 * 3. Secure Configuration (Technical Specification/5. SECURITY CONSIDERATIONS)
 *    - Ensures secure handling of sensitive configuration data
 * 
 * The module includes configurations for:
 * - Global settings (NODE_ENV, PORT, API_VERSION, CORS_ORIGINS)
 * - AWS services
 * - Database (MongoDB)
 * - Redis cache
 * - SMS service (Twilio)
 * - Geolocation service (Google Maps API)
 * 
 * It also provides functions for loading environment variables and validating configurations.
 */