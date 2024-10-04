import { Redis } from 'ioredis';
import { REDIS_CONFIG } from '../config/redis';
import logger from '../utils/logger';
import { handleError } from '../utils/errorHandlers';

/**
 * CacheService class provides caching functionality for the backend,
 * implementing Redis-based caching to improve performance and reduce database load.
 * 
 * Requirements addressed:
 * - High Performance (Technical Specification/2.2 High-Level Architecture Diagram)
 * - Scalability (Technical Specification/6.1 Deployment Environment)
 * - Data Layer Integration (Technical Specification/2.2 High-Level Architecture Diagram)
 */
export class CacheService {
  private static instance: CacheService;
  private client: Redis;

  private constructor() {
    this.client = new Redis(REDIS_CONFIG);
    this.setupEventListeners();
  }

  /**
   * Returns the singleton instance of the CacheService
   * @returns {CacheService} Singleton instance of the service
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Sets up event listeners for the Redis client
   */
  private setupEventListeners(): void {
    this.client.on('connect', () => logger.info('Redis client connected'));
    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
      handleError(error);
    });
  }

  /**
   * Sets a value in the cache
   * @param {string} key - The key to set
   * @param {any} value - The value to set
   * @param {number} expiration - Optional expiration time in seconds
   * @returns {Promise<void>} Promise that resolves when the value is set
   */
  public async set(key: string, value: any, expiration?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (expiration) {
        await this.client.setex(key, expiration, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error(`Error setting cache key ${key}:`, error);
      handleError(error);
    }
  }

  /**
   * Retrieves a value from the cache
   * @param {string} key - The key to retrieve
   * @returns {Promise<T | null>} Promise that resolves with the cached value or null
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (value) {
        logger.debug(`Cache hit: ${key}`);
        return JSON.parse(value) as T;
      }
      logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Error getting cache key ${key}:`, error);
      handleError(error);
      return null;
    }
  }

  /**
   * Removes a value from the cache
   * @param {string} key - The key to delete
   * @returns {Promise<void>} Promise that resolves when the value is deleted
   */
  public async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
      logger.debug(`Cache delete: ${key}`);
    } catch (error) {
      logger.error(`Error deleting cache key ${key}:`, error);
      handleError(error);
    }
  }

  /**
   * Clears all cached data
   * @returns {Promise<void>} Promise that resolves when the cache is cleared
   */
  public async flush(): Promise<void> {
    try {
      await this.client.flushdb();
      logger.info('Cache flushed');
    } catch (error) {
      logger.error('Error flushing cache:', error);
      handleError(error);
    }
  }

  /**
   * Gets a value from cache or sets it if not found
   * @param {string} key - The key to get or set
   * @param {() => Promise<T>} callback - Function to call if key is not in cache
   * @param {number} expiration - Optional expiration time in seconds
   * @returns {Promise<T>} Promise that resolves with the value
   */
  public async getOrSet<T>(key: string, callback: () => Promise<T>, expiration?: number): Promise<T> {
    try {
      const cachedValue = await this.get<T>(key);
      if (cachedValue !== null) {
        return cachedValue;
      }

      const newValue = await callback();
      await this.set(key, newValue, expiration);
      return newValue;
    } catch (error) {
      logger.error(`Error in getOrSet for key ${key}:`, error);
      handleError(error);
      throw error;
    }
  }
}

export default CacheService.getInstance();