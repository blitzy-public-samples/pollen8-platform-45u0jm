/**
 * This file defines the caching strategies and policies for the Redis caching layer in the Pollen8 platform,
 * ensuring optimal performance and data consistency across the application.
 * 
 * Requirements addressed:
 * 1. Performance Optimization (Technical Specification/2.2 High-Level Architecture Diagram):
 *    Implements efficient caching strategies for fast data retrieval
 * 2. Scalability (Technical Specification/2.1 Programming Languages):
 *    Ensures cache management scales with user growth
 * 3. Data Consistency (Technical Specification/2.3.2 Backend Components):
 *    Maintains consistency between cache and database
 */

import { CacheKeyType, generateUserKey, generateNetworkKey } from './keys';

// Global constants for default cache settings
export const DEFAULT_TTL = 3600; // Default Time-To-Live in seconds (1 hour)
export const DEFAULT_SWR = 300; // Default Stale-While-Revalidate time in seconds (5 minutes)

/**
 * Interface defining the structure of a cache strategy
 */
interface ICacheStrategy {
  ttl: number; // Time-To-Live in seconds
  swr: number; // Stale-While-Revalidate time in seconds
  maxSize?: number; // Maximum size of cacheable data in bytes (optional)
}

/**
 * Cache strategies for different types of data
 */
const CacheStrategies: Record<CacheKeyType, ICacheStrategy> = {
  [CacheKeyType.USER]: {
    ttl: 1800, // 30 minutes
    swr: 300, // 5 minutes
    maxSize: 10240 // 10 KB
  },
  [CacheKeyType.NETWORK]: {
    ttl: 3600, // 1 hour
    swr: 600, // 10 minutes
    maxSize: 102400 // 100 KB
  },
  [CacheKeyType.INVITE]: {
    ttl: 86400, // 24 hours
    swr: 3600, // 1 hour
  },
  [CacheKeyType.INDUSTRY_LIST]: {
    ttl: 86400, // 24 hours
    swr: 3600, // 1 hour
  },
  [CacheKeyType.INTEREST_LIST]: {
    ttl: 86400, // 24 hours
    swr: 3600, // 1 hour
  }
};

/**
 * Determines if data should be cached based on type and size
 * @param keyType - The type of cache key
 * @param dataSize - The size of the data to be cached in bytes
 * @returns Whether the data should be cached
 */
export function shouldCache(keyType: CacheKeyType, dataSize: number): boolean {
  const strategy = CacheStrategies[keyType];
  if (!strategy) {
    return false;
  }
  return !strategy.maxSize || dataSize <= strategy.maxSize;
}

/**
 * Calculates the expiry time for a cache entry based on its type
 * @param keyType - The type of cache key
 * @returns Expiry time in seconds
 */
export function getExpiryTime(keyType: CacheKeyType): number {
  const strategy = CacheStrategies[keyType];
  return strategy ? strategy.ttl : DEFAULT_TTL;
}

/**
 * Determines if cached data should be revalidated based on type and age
 * @param keyType - The type of cache key
 * @param lastUpdated - The date when the cache was last updated
 * @returns Whether the data should be revalidated
 */
export function shouldRevalidate(keyType: CacheKeyType, lastUpdated: Date): boolean {
  const strategy = CacheStrategies[keyType];
  if (!strategy) {
    return true;
  }
  const timeSinceUpdate = (Date.now() - lastUpdated.getTime()) / 1000;
  return timeSinceUpdate > strategy.swr;
}

/**
 * Interface for a cache entry with metadata
 */
interface CacheEntry<T> {
  data: T;
  lastUpdated: Date;
  expiresAt: Date;
}

/**
 * Class to manage cache strategies and provide an interface for strategy-based caching
 */
export class CacheStrategyManager {
  private strategies: Record<CacheKeyType, ICacheStrategy>;

  constructor() {
    this.strategies = CacheStrategies;
  }

  /**
   * Applies the appropriate caching strategy to the provided data
   * @param keyType - The type of cache key
   * @param data - The data to be cached
   * @returns Processed cache entry with applied strategy
   */
  public applyStrategy<T>(keyType: CacheKeyType, data: T): CacheEntry<T> {
    const strategy = this.strategies[keyType];
    const now = new Date();
    return {
      data,
      lastUpdated: now,
      expiresAt: new Date(now.getTime() + (strategy?.ttl || DEFAULT_TTL) * 1000)
    };
  }

  /**
   * Generates a cache key based on the key type and identifier
   * @param keyType - The type of cache key
   * @param id - The identifier for the cache key
   * @returns Generated cache key
   */
  public generateKey(keyType: CacheKeyType, id: string): string {
    switch (keyType) {
      case CacheKeyType.USER:
        return generateUserKey(id);
      case CacheKeyType.NETWORK:
        return generateNetworkKey(id);
      default:
        throw new Error(`Unsupported key type: ${keyType}`);
    }
  }

  /**
   * Checks if the cached data is still valid
   * @param entry - The cache entry to check
   * @returns Whether the cache entry is still valid
   */
  public isValid(entry: CacheEntry<any>): boolean {
    return new Date() < entry.expiresAt;
  }

  /**
   * Checks if the cached data needs revalidation
   * @param keyType - The type of cache key
   * @param entry - The cache entry to check
   * @returns Whether the cache entry needs revalidation
   */
  public needsRevalidation(keyType: CacheKeyType, entry: CacheEntry<any>): boolean {
    return shouldRevalidate(keyType, entry.lastUpdated);
  }
}

// Export an instance of the CacheStrategyManager for use across the application
export const cacheStrategyManager = new CacheStrategyManager();