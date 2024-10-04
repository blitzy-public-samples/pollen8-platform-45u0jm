import dotenv from 'dotenv';
import { ENVIRONMENTS } from '@shared/config/environments';
import { RedisConfig, createSocketRedisConfig, SOCKET_REDIS_CONFIG } from './redis';
import { getJwtConfig } from './jwt';
import { CorsOptions } from 'cors';

// Load environment variables from the appropriate .env file based on NODE_ENV
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

// Constants for default values
const DEFAULT_PORT = 3001;
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PING_TIMEOUT = 5000;
const DEFAULT_PING_INTERVAL = 10000;

/**
 * Interface defining the structure of the complete Socket.io server configuration
 */
export interface SocketConfig {
  port: number;
  host: string;
  redis: RedisConfig;
  jwt: ReturnType<typeof getJwtConfig>;
  cors: CorsOptions;
  pingTimeout: number;
  pingInterval: number;
}

/**
 * Loads environment variables and validates required ones
 * @throws {Error} If required environment variables are missing
 */
function loadEnvironment(): void {
  const requiredEnvVars = ['NODE_ENV', 'JWT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  // Set default values for optional variables
  process.env.PORT = process.env.PORT || DEFAULT_PORT.toString();
  process.env.HOST = process.env.HOST || DEFAULT_HOST;
}

/**
 * Returns the complete Socket.io server configuration object
 * @returns {SocketConfig} Complete Socket.io configuration object
 */
export function getSocketConfig(): SocketConfig {
  loadEnvironment();

  const env = ENVIRONMENTS[process.env.NODE_ENV as keyof typeof ENVIRONMENTS] || ENVIRONMENTS.development;

  return {
    port: parseInt(process.env.PORT || DEFAULT_PORT.toString(), 10),
    host: process.env.HOST || DEFAULT_HOST,
    redis: SOCKET_REDIS_CONFIG,
    jwt: getJwtConfig(),
    cors: {
      origin: env.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || DEFAULT_PING_TIMEOUT.toString(), 10),
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || DEFAULT_PING_INTERVAL.toString(), 10),
  };
}

// Export the configuration object
export const config = getSocketConfig();

// Export other configuration modules for easy access
export * from './redis';
export * from './jwt';