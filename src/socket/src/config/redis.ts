import { RedisConfig } from '../../../shared/interfaces/redis.interface';
import { config } from './index';

// Constants for default values
const DEFAULT_SOCKET_REDIS_PORT = 6379;
const DEFAULT_SOCKET_REDIS_DB = 1;
const DEFAULT_SOCKET_KEY_PREFIX = 'pollen8:socket:';
const DEFAULT_SOCKET_TIMEOUT = 20000;
const DEFAULT_PUBLISH_RETRIES = 3;
const DEFAULT_PUBLISH_TIMEOUT = 5000;

/**
 * Interface defining the structure of Redis configuration for Socket.io
 */
export interface RedisConfig {
  host: string;
  port: number;
  password: string;
  db: number;
  keyPrefix: string;
  socketTimeout: number;
  publishRetries: number;
  publishTimeout: number;
}

/**
 * Creates Redis configuration for Socket.io based on the environment
 * @param env - The current environment (e.g., 'development', 'staging', 'production')
 * @returns RedisConfig - Redis configuration object
 */
export function createSocketRedisConfig(env: string): RedisConfig {
  // Validate environment name
  if (!['development', 'staging', 'production'].includes(env)) {
    throw new Error(`Invalid environment: ${env}`);
  }

  // Check for required environment variables
  const host = process.env.SOCKET_REDIS_HOST || 'localhost';
  const portStr = process.env.SOCKET_REDIS_PORT || DEFAULT_SOCKET_REDIS_PORT.toString();
  const password = process.env.SOCKET_REDIS_PASSWORD;
  const dbStr = process.env.SOCKET_REDIS_DB || DEFAULT_SOCKET_REDIS_DB.toString();

  // Validate port number
  const port = parseInt(portStr, 10);
  if (isNaN(port)) {
    throw new Error(`Invalid SOCKET_REDIS_PORT: ${portStr}`);
  }

  // Validate db number
  const db = parseInt(dbStr, 10);
  if (isNaN(db)) {
    throw new Error(`Invalid SOCKET_REDIS_DB: ${dbStr}`);
  }

  // Create and return RedisConfig object with appropriate values based on environment
  return {
    host,
    port,
    password: password || '',
    db,
    keyPrefix: DEFAULT_SOCKET_KEY_PREFIX,
    socketTimeout: DEFAULT_SOCKET_TIMEOUT,
    publishRetries: DEFAULT_PUBLISH_RETRIES,
    publishTimeout: DEFAULT_PUBLISH_TIMEOUT,
  };
}

// Export the Redis configuration
export const SOCKET_REDIS_CONFIG: RedisConfig = createSocketRedisConfig(config.NODE_ENV);