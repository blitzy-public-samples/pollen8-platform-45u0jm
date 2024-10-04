/**
 * A utility file that provides caching functionality for the Pollen8 platform,
 * implementing efficient data caching strategies using Redis.
 * 
 * Requirements addressed:
 * 1. Performance Optimization (Technical Specification/2.2 High-Level Architecture Diagram):
 *    Implements caching for fast data retrieval
 * 2. Scalability (Technical Specification/2.1 Programming Languages):
 *    Ensures efficient data access as user base grows
 * 3. Real-time Updates (Technical Specification/2.3.2 Backend Components):
 *    Supports quick data access for real-time features
 */

import { CacheKeyType, generateUserKey, generateNetworkKey } from '../cache/keys';
import { CacheStrategies, ICacheStrategy, cacheStrategyManager } from '../cache/strategies';
import { RedisManager, redisManager } from '../config/redis.config';
import { Logger } from '../utils/logger';

// Initialize logger
const logger = new Logger('CacheUtil');

/**
 * Interface for cache options
 */
interface ICacheOptions {
  ttl?: number;
  strategy?: ICacheStrategy;
  bypassCache?: boolean;
}

/**
 * Utility class that provides caching functionality for the application.
 */
class CacheUtil {
  private redisManager: RedisManager;
  private logger: Logger;

  constructor() {
    this.redisManager = redisManager;
    this.logger = logger;
  }

  /**
   * Caches data using the specified key and type.
   * @param key - The cache key
   * @param data - The data to cache
   * @param type - The type of cache key
   * @param options - Caching options
   * @returns Promise<void>
   */
  async cacheData<T>(key: string, data: T, type: CacheKeyType, options?: ICacheOptions): Promise<void> {
    try {
      const strategy = options?.strategy || CacheStrategies[type];
      const ttl = options?.ttl || strategy.ttl;

      await this.redisManager.set(key, data, type);
      this.logger.info(`Cached data for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error caching data for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves cached data for the specified key.
   * @param key - The cache key
   * @param type - The type of cache key
   * @returns Promise<T | null> - Cached data or null if not found
   */
  async getCachedData<T>(key: string, type: CacheKeyType): Promise<T | null> {
    try {
      const data = await this.redisManager.get<T>(key, type);
      if (data) {
        this.logger.info(`Retrieved cached data for key: ${key}`);
      } else {
        this.logger.info(`No cached data found for key: ${key}`);
      }
      return data;
    } catch (error) {
      this.logger.error(`Error retrieving cached data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Invalidates (removes) cached data for the specified key.
   * @param key - The cache key
   * @returns Promise<void>
   */
  async invalidateCache(key: string): Promise<void> {
    try {
      await this.redisManager.del(key);
      this.logger.info(`Invalidated cache for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache for key ${key}:`, error);
      throw error;
    }
  }
}

/**
 * Higher-order function that implements the cache-aside pattern.
 * @param key - The cache key
 * @param type - The type of cache key
 * @param fetchFn - Function to fetch data if not in cache
 * @param options - Caching options
 * @returns Promise<T> - Cached data or freshly fetched data
 */
export async function withCache<T>(
  key: string,
  type: CacheKeyType,
  fetchFn: () => Promise<T>,
  options?: ICacheOptions
): Promise<T> {
  const cacheUtil = new CacheUtil();

  if (options?.bypassCache) {
    logger.info(`Bypassing cache for key: ${key}`);
    const data = await fetchFn();
    await cacheUtil.cacheData(key, data, type, options);
    return data;
  }

  const cachedData = await cacheUtil.getCachedData<T>(key, type);
  if (cachedData !== null) {
    return cachedData;
  }

  logger.info(`Cache miss for key: ${key}, fetching fresh data`);
  const freshData = await fetchFn();
  await cacheUtil.cacheData(key, freshData, type, options);
  return freshData;
}

// Export the CacheUtil class and withCache function
export { CacheUtil, ICacheOptions };