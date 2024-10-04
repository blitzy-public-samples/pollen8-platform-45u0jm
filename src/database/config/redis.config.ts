/**
 * Configuration file for Redis connection and settings in the Pollen8 platform,
 * ensuring efficient caching and real-time data management.
 * 
 * Requirements addressed:
 * 1. Caching Layer (Technical Specification/2.2 High-Level Architecture Diagram/Data Layer):
 *    Implements Redis for performance optimization
 * 2. Real-time Updates (Technical Specification/2.3.2 Backend Components):
 *    Supports WebSocket server with Redis pub/sub
 * 3. Performance Benchmarks (Technical Specification/8.1.2 Performance Benchmarks):
 *    Configures Redis for sub-millisecond latency
 */

import Redis, { Cluster, Redis as RedisClient } from 'ioredis';
import { CacheKeyType } from '../cache/keys';
import { cacheStrategyManager, CacheStrategyManager } from '../cache/strategies';
import { logger } from '../utils/logger';

// Environment variables
const REDIS_URI = process.env.REDIS_URI;
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

// Redis connection options
const redisOptions = {
  host: REDIS_URI,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  connectTimeout: 10000,
  lazyConnect: true,
};

/**
 * Creates and establishes a connection to Redis with proper configuration and error handling.
 * @returns Promise<Redis> Redis client instance
 */
export async function createRedisConnection(): Promise<RedisClient> {
  const client = new Redis(redisOptions);

  client.on('error', (error) => {
    logger.error('Redis connection error:', error);
  });

  client.on('connect', () => {
    logger.info('Connected to Redis');
  });

  await client.connect();
  return client;
}

/**
 * Creates a Redis cluster connection for high availability.
 * @param nodes Array of cluster node configurations
 * @returns Promise<Cluster> Redis cluster instance
 */
export async function createRedisCluster(nodes: Array<{ host: string; port: number }>): Promise<Cluster> {
  const cluster = new Redis.Cluster(nodes, {
    redisOptions: {
      password: REDIS_PASSWORD,
      connectTimeout: 10000,
      lazyConnect: true,
    },
    clusterRetryStrategy: (times: number) => {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });

  cluster.on('error', (error) => {
    logger.error('Redis cluster connection error:', error);
  });

  cluster.on('connect', () => {
    logger.info('Connected to Redis cluster');
  });

  await cluster.connect();
  return cluster;
}

/**
 * Manages Redis connections and provides an interface for Redis operations.
 */
export class RedisManager {
  private client: RedisClient;
  private subscriber: RedisClient;
  private strategyManager: CacheStrategyManager;

  constructor() {
    this.strategyManager = cacheStrategyManager;
  }

  /**
   * Initializes Redis client and subscriber connections
   */
  async initialize(): Promise<void> {
    this.client = await createRedisConnection();
    this.subscriber = await createRedisConnection();

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    this.subscriber.on('error', (error) => {
      logger.error('Redis subscriber error:', error);
    });
  }

  /**
   * Sets a value in Redis with the appropriate caching strategy.
   * @param key The key to set
   * @param value The value to set
   * @param type The type of cache key
   * @returns Promise<void>
   */
  async set(key: string, value: unknown, type: CacheKeyType): Promise<void> {
    const cacheEntry = this.strategyManager.applyStrategy(type, value);
    const serializedValue = JSON.stringify(cacheEntry);
    const expiryTime = Math.floor((cacheEntry.expiresAt.getTime() - Date.now()) / 1000);

    try {
      await this.client.set(key, serializedValue, 'EX', expiryTime);
    } catch (error) {
      logger.error(`Error setting Redis key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Gets a value from Redis and handles cache invalidation.
   * @param key The key to get
   * @param type The type of cache key
   * @returns Promise<T | null> The value or null if not found
   */
  async get<T>(key: string, type: CacheKeyType): Promise<T | null> {
    try {
      const result = await this.client.get(key);
      if (!result) return null;

      const cacheEntry = JSON.parse(result);
      if (!this.strategyManager.isValid(cacheEntry)) {
        await this.client.del(key);
        return null;
      }

      if (this.strategyManager.needsRevalidation(type, cacheEntry)) {
        // Trigger background revalidation
        this.triggerRevalidation(key, type);
      }

      return cacheEntry.data as T;
    } catch (error) {
      logger.error(`Error getting Redis key ${key}:`, error);
      return null;
    }
  }

  /**
   * Deletes a key from Redis.
   * @param key The key to delete
   * @returns Promise<void>
   */
  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error(`Error deleting Redis key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Publishes a message to a Redis channel.
   * @param channel The channel to publish to
   * @param message The message to publish
   * @returns Promise<void>
   */
  async publish(channel: string, message: string): Promise<void> {
    try {
      await this.client.publish(channel, message);
    } catch (error) {
      logger.error(`Error publishing to Redis channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Subscribes to a Redis channel.
   * @param channel The channel to subscribe to
   * @param callback The callback to execute when a message is received
   * @returns Promise<void>
   */
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.subscriber.subscribe(channel);
      this.subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          callback(message);
        }
      });
    } catch (error) {
      logger.error(`Error subscribing to Redis channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Triggers a background revalidation of a cache entry.
   * @param key The key to revalidate
   * @param type The type of cache key
   * @returns Promise<void>
   */
  private async triggerRevalidation(key: string, type: CacheKeyType): Promise<void> {
    // Implement the logic to fetch fresh data and update the cache
    // This is a placeholder and should be implemented based on your data fetching logic
    logger.info(`Triggering revalidation for key: ${key}`);
    // Example: const freshData = await fetchFreshData(key, type);
    // await this.set(key, freshData, type);
  }

  /**
   * Closes the Redis connections.
   * @returns Promise<void>
   */
  async close(): Promise<void> {
    await this.client.quit();
    await this.subscriber.quit();
  }
}

// Export a singleton instance of RedisManager
export const redisManager = new RedisManager();