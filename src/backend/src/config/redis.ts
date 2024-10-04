import { RedisConfig } from '../../shared/interfaces/redis.interface';

// Constants for default values
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_REDIS_DB = 0;
const DEFAULT_KEY_PREFIX = 'pollen8:';
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_CONNECT_TIMEOUT = 10000;
const DEFAULT_DISCONNECT_TIMEOUT = 5000;

/**
 * Creates Redis configuration based on the environment
 * @param env - The environment name (e.g., 'development', 'production')
 * @returns RedisConfig object
 */
export const createRedisConfig = (env: string): RedisConfig => {
  // Validate environment name
  if (!['development', 'staging', 'production'].includes(env)) {
    throw new Error('Invalid environment name');
  }

  // Check for required environment variables
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || DEFAULT_REDIS_PORT.toString(), 10);
  const password = process.env.REDIS_PASSWORD;
  const db = parseInt(process.env.REDIS_DB || DEFAULT_REDIS_DB.toString(), 10);

  // Validate port number
  if (isNaN(port) || port <= 0 || port > 65535) {
    throw new Error('Invalid Redis port number');
  }

  // Create and return RedisConfig object
  const config: RedisConfig = {
    host,
    port,
    password,
    db,
    keyPrefix: DEFAULT_KEY_PREFIX,
    maxRetriesPerRequest: DEFAULT_MAX_RETRIES,
    enableReadyCheck: true,
    connectTimeout: DEFAULT_CONNECT_TIMEOUT,
    disconnectTimeout: DEFAULT_DISCONNECT_TIMEOUT,
  };

  return config;
};

// Export the Redis configuration
export const REDIS_CONFIG: RedisConfig = createRedisConfig(process.env.NODE_ENV || 'development');

// Export other constants for use in other parts of the application
export {
  DEFAULT_REDIS_PORT,
  DEFAULT_REDIS_DB,
  DEFAULT_KEY_PREFIX,
  DEFAULT_MAX_RETRIES,
  DEFAULT_CONNECT_TIMEOUT,
  DEFAULT_DISCONNECT_TIMEOUT,
};