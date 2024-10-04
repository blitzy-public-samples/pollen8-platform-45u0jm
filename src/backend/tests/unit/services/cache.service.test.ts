import { Redis } from 'ioredis';
import { CacheService } from '../../../src/services/cache.service';
import { REDIS_CONFIG } from '../../../src/config/redis';
import logger from '../../../src/utils/logger';
import { handleError } from '../../../src/utils/errorHandlers';

// Mock dependencies
jest.mock('ioredis');
jest.mock('../../../src/config/redis');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/errorHandlers');

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockRedisClient: jest.Mocked<Redis>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Initialize CacheService instance
    cacheService = CacheService.getInstance();

    // Setup mock Redis client
    mockRedisClient = new Redis(REDIS_CONFIG) as jest.Mocked<Redis>;
    (cacheService as any).client = mockRedisClient;
  });

  afterEach(() => {
    // Reset mock Redis client
    jest.resetAllMocks();
  });

  test('should return singleton instance', () => {
    // Requirement: High Performance (Technical Specification/2.2 High-Level Architecture Diagram)
    const instance1 = CacheService.getInstance();
    const instance2 = CacheService.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('should set value in cache', async () => {
    // Requirement: Data Layer Testing (Technical Specification/2.2 High-Level Architecture Diagram)
    const key = 'testKey';
    const value = { data: 'testValue' };
    const expiration = 3600;

    await cacheService.set(key, value, expiration);

    expect(mockRedisClient.setex).toHaveBeenCalledWith(key, expiration, JSON.stringify(value));
    expect(logger.debug).toHaveBeenCalledWith(`Cache set: ${key}`);
  });

  test('should retrieve value from cache', async () => {
    // Requirement: High Performance (Technical Specification/2.2 High-Level Architecture Diagram)
    const key = 'testKey';
    const value = { data: 'testValue' };

    mockRedisClient.get.mockResolvedValue(JSON.stringify(value));

    const result = await cacheService.get(key);

    expect(mockRedisClient.get).toHaveBeenCalledWith(key);
    expect(result).toEqual(value);
    expect(logger.debug).toHaveBeenCalledWith(`Cache hit: ${key}`);
  });

  test('should remove value from cache', async () => {
    // Requirement: Data Layer Testing (Technical Specification/2.2 High-Level Architecture Diagram)
    const key = 'testKey';

    await cacheService.delete(key);

    expect(mockRedisClient.del).toHaveBeenCalledWith(key);
    expect(logger.debug).toHaveBeenCalledWith(`Cache delete: ${key}`);
  });

  test('should clear all cached data', async () => {
    // Requirement: Scalability (Technical Specification/6.1 Deployment Environment)
    await cacheService.flush();

    expect(mockRedisClient.flushdb).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith('Cache flushed');
  });

  test('should get existing value or set new value', async () => {
    // Requirement: High Performance (Technical Specification/2.2 High-Level Architecture Diagram)
    const key = 'testKey';
    const value = { data: 'testValue' };
    const expiration = 3600;

    // Test cache hit scenario
    mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(value));
    const cachedResult = await cacheService.getOrSet(key, async () => value, expiration);
    expect(cachedResult).toEqual(value);
    expect(mockRedisClient.get).toHaveBeenCalledWith(key);
    expect(mockRedisClient.setex).not.toHaveBeenCalled();

    // Test cache miss scenario
    mockRedisClient.get.mockResolvedValueOnce(null);
    const callback = jest.fn().mockResolvedValue(value);
    const newResult = await cacheService.getOrSet(key, callback, expiration);
    expect(newResult).toEqual(value);
    expect(callback).toHaveBeenCalled();
    expect(mockRedisClient.setex).toHaveBeenCalledWith(key, expiration, JSON.stringify(value));
  });

  test('should handle connection errors gracefully', async () => {
    // Requirement: Scalability (Technical Specification/6.1 Deployment Environment)
    const error = new Error('Redis connection error');
    mockRedisClient.get.mockRejectedValue(error);

    await cacheService.get('testKey');

    expect(logger.error).toHaveBeenCalledWith('Error getting cache key testKey:', error);
    expect(handleError).toHaveBeenCalledWith(error);
  });
});