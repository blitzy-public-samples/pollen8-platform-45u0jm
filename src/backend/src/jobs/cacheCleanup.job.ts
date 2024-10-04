import { Schedule } from 'node-schedule';
import CacheService from '../services/cache.service';
import logger from '../utils/logger';
import { REDIS_CONFIG } from '../config/redis';

/**
 * CacheCleanupJob class handles the scheduled cleanup of Redis cache
 * to prevent memory bloat and ensure optimal performance of the caching layer.
 * 
 * Requirements addressed:
 * - High Performance (Technical Specification/2.2 High-Level Architecture Diagram)
 * - Resource Optimization (Technical Specification/6.1 Deployment Environment)
 */
export class CacheCleanupJob {
  private cacheService: CacheService;
  private schedule: Schedule;

  // Constants for the cleanup job
  private static readonly CLEANUP_SCHEDULE = '0 2 * * *'; // Run daily at 2 AM
  private static readonly MAX_CACHE_SIZE = 1024 * 1024 * 1024; // 1 GB

  /**
   * Initializes the cleanup job with a cache service instance
   * @param cacheService Instance of CacheService
   */
  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
    this.schedule = new Schedule();
  }

  /**
   * Starts the scheduled cache cleanup job
   */
  public start(): void {
    this.schedule.scheduleJob(CacheCleanupJob.CLEANUP_SCHEDULE, async () => {
      try {
        await this.cleanup();
      } catch (error) {
        logger.error('Error during cache cleanup:', error);
      }
    });
    logger.info('Cache cleanup job scheduled');
  }

  /**
   * Stops the scheduled cache cleanup job
   */
  public stop(): void {
    this.schedule.gracefulShutdown();
    logger.info('Cache cleanup job stopped');
  }

  /**
   * Performs the actual cache cleanup operations
   */
  private async cleanup(): Promise<void> {
    logger.info('Starting cache cleanup');

    try {
      const info = await this.getCacheInfo();
      const usedMemory = parseInt(info['used_memory']);

      if (usedMemory > CacheCleanupJob.MAX_CACHE_SIZE) {
        const keysToRemove = await this.getKeysToRemove(usedMemory - CacheCleanupJob.MAX_CACHE_SIZE);
        await this.removeKeys(keysToRemove);
        logger.info(`Removed ${keysToRemove.length} keys from cache`);
      } else {
        logger.info('Cache size within limits, no cleanup needed');
      }

      logger.info('Cache cleanup completed');
    } catch (error) {
      logger.error('Error during cache cleanup:', error);
      throw error;
    }
  }

  /**
   * Retrieves information about the Redis cache
   */
  private async getCacheInfo(): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
      this.cacheService['client'].info((err, result) => {
        if (err) reject(err);
        const info: Record<string, string> = {};
        result.split('\r\n').forEach(line => {
          const [key, value] = line.split(':');
          if (key && value) info[key] = value;
        });
        resolve(info);
      });
    });
  }

  /**
   * Determines which keys to remove based on the excess memory usage
   * @param excessMemory Amount of memory to free up
   */
  private async getKeysToRemove(excessMemory: number): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const keysToRemove: string[] = [];
      let removedMemory = 0;

      const stream = this.cacheService['client'].scanStream({
        count: 100
      });

      stream.on('data', async (resultKeys: string[]) => {
        for (const key of resultKeys) {
          const memory = await this.getKeyMemoryUsage(key);
          keysToRemove.push(key);
          removedMemory += memory;

          if (removedMemory >= excessMemory) {
            stream.pause();
            resolve(keysToRemove);
            return;
          }
        }
      });

      stream.on('end', () => resolve(keysToRemove));
      stream.on('error', reject);
    });
  }

  /**
   * Gets the memory usage of a specific key
   * @param key Redis key
   */
  private async getKeyMemoryUsage(key: string): Promise<number> {
    return new Promise((resolve, reject) => {
      this.cacheService['client'].memory('usage', key, (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }

  /**
   * Removes the specified keys from the cache
   * @param keys Array of keys to remove
   */
  private async removeKeys(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    return new Promise((resolve, reject) => {
      this.cacheService['client'].del(keys, (err) => {
        if (err) reject(err);
        resolve();
      });
    });
  }
}

// Export an instance of the CacheCleanupJob
export default new CacheCleanupJob(CacheService);