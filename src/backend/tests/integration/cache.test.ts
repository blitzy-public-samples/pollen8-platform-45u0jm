import { Redis } from 'ioredis';
import { CacheService } from '../../src/services/cache.service';
import { REDIS_CONFIG } from '../../src/config/redis';

describe('CacheService Integration Tests', () => {
  let cacheService: CacheService;
  let redisClient: Redis;

  const testKey = 'testKey';
  const testValue = { name: 'John Doe', age: 30 };
  const expirationTime = 5; // 5 seconds

  beforeAll(async () => {
    // Initialize Redis client for testing
    redisClient = new Redis(REDIS_CONFIG);
    
    // Get the CacheService instance
    cacheService = CacheService.getInstance();
  });

  afterAll(async () => {
    // Close Redis connection
    await redisClient.quit();
  });

  beforeEach(async () => {
    // Clear the cache before each test
    await cacheService.flush();
  });

  it('should successfully set and get a value', async () => {
    await cacheService.set(testKey, testValue);
    const retrievedValue = await cacheService.get(testKey);
    expect(retrievedValue).toEqual(testValue);
  });

  it('should return null for non-existent keys', async () => {
    const nonExistentValue = await cacheService.get('nonExistentKey');
    expect(nonExistentValue).toBeNull();
  });

  it('should correctly delete a value', async () => {
    await cacheService.set(testKey, testValue);
    await cacheService.delete(testKey);
    const deletedValue = await cacheService.get(testKey);
    expect(deletedValue).toBeNull();
  });

  it('should properly handle expiration of cached items', async () => {
    await cacheService.set(testKey, testValue, expirationTime);
    
    // Value should exist immediately after setting
    let retrievedValue = await cacheService.get(testKey);
    expect(retrievedValue).toEqual(testValue);
    
    // Wait for the key to expire
    await new Promise(resolve => setTimeout(resolve, (expirationTime + 1) * 1000));
    
    // Value should be null after expiration
    retrievedValue = await cacheService.get(testKey);
    expect(retrievedValue).toBeNull();
  });

  it('should successfully flush all cached data', async () => {
    await cacheService.set('key1', 'value1');
    await cacheService.set('key2', 'value2');
    
    await cacheService.flush();
    
    const value1 = await cacheService.get('key1');
    const value2 = await cacheService.get('key2');
    
    expect(value1).toBeNull();
    expect(value2).toBeNull();
  });

  it('should handle concurrent operations correctly', async () => {
    const concurrentOperations = 100;
    const promises = [];

    for (let i = 0; i < concurrentOperations; i++) {
      promises.push(cacheService.set(`key${i}`, `value${i}`));
    }

    await Promise.all(promises);

    for (let i = 0; i < concurrentOperations; i++) {
      const value = await cacheService.get(`key${i}`);
      expect(value).toBe(`value${i}`);
    }
  });

  it('should implement getOrSet functionality properly', async () => {
    const mockCallback = jest.fn().mockResolvedValue(testValue);

    // First call should use the callback
    const result1 = await cacheService.getOrSet(testKey, mockCallback, expirationTime);
    expect(result1).toEqual(testValue);
    expect(mockCallback).toHaveBeenCalledTimes(1);

    // Second call should return cached value without calling the callback
    const result2 = await cacheService.getOrSet(testKey, mockCallback, expirationTime);
    expect(result2).toEqual(testValue);
    expect(mockCallback).toHaveBeenCalledTimes(1);

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, (expirationTime + 1) * 1000));

    // After expiration, callback should be called again
    const result3 = await cacheService.getOrSet(testKey, mockCallback, expirationTime);
    expect(result3).toEqual(testValue);
    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  it('should handle various data types correctly', async () => {
    const testCases = [
      { key: 'stringTest', value: 'Hello, World!' },
      { key: 'numberTest', value: 42 },
      { key: 'booleanTest', value: true },
      { key: 'arrayTest', value: [1, 2, 3, 4, 5] },
      { key: 'objectTest', value: { a: 1, b: 'two', c: [3] } },
      { key: 'nullTest', value: null },
    ];

    for (const { key, value } of testCases) {
      await cacheService.set(key, value);
      const retrievedValue = await cacheService.get(key);
      expect(retrievedValue).toEqual(value);
    }
  });

  it('should handle errors gracefully', async () => {
    const mockErrorCallback = jest.fn().mockRejectedValue(new Error('Test error'));

    await expect(cacheService.getOrSet('errorKey', mockErrorCallback)).rejects.toThrow('Test error');
  });

  it('should respect key prefixes from configuration', async () => {
    const keyPrefix = REDIS_CONFIG.keyPrefix || '';
    await cacheService.set(testKey, testValue);

    // Check if the key is stored with the prefix
    const rawValue = await redisClient.get(`${keyPrefix}${testKey}`);
    expect(JSON.parse(rawValue!)).toEqual(testValue);
  });
});