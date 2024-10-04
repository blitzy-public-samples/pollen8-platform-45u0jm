import { RedisService } from '../../src/services/redisService';
import { SOCKET_REDIS_CONFIG } from '../../src/config/redis';
import { socketLogger } from '../../src/utils/logger';
import Redis from 'ioredis';

describe('RedisService Integration Tests', () => {
  let redisService: RedisService;

  beforeAll(async () => {
    // Initialize RedisService instance
    redisService = RedisService.getInstance();
    try {
      await redisService.connect();
    } catch (error) {
      socketLogger.error('Failed to connect to Redis for testing', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Disconnect from Redis and clean up
    try {
      await redisService.disconnect();
    } catch (error) {
      socketLogger.error('Error during Redis cleanup', error);
    }
  });

  const mockSocketData = () => ({
    userId: 'user123',
    connectionInfo: {
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    },
    lastActive: new Date().toISOString()
  });

  const verifyRedisOperation = async (operation: () => Promise<void>): Promise<void> => {
    try {
      await operation();
    } catch (error) {
      socketLogger.error('Redis operation failed', error);
      throw error;
    }
  };

  test('should connect to Redis successfully', async () => {
    expect(redisService).toBeDefined();
    // The connection is already established in beforeAll, so we just need to verify it's working
    await verifyRedisOperation(async () => {
      await redisService['client'].ping();
    });
  });

  test('should store and retrieve socket data', async () => {
    const socketId = 'test-socket-123';
    const testData = mockSocketData();

    await verifyRedisOperation(async () => {
      await redisService.setSocketData(socketId, testData);
      const retrievedData = await redisService.getSocketData(socketId);
      expect(retrievedData).toEqual(testData);
    });
  });

  test('should handle socket data expiry', async () => {
    const socketId = 'expiring-socket-456';
    const testData = mockSocketData();
    const expiryInSeconds = 1;

    await verifyRedisOperation(async () => {
      await redisService.setSocketData(socketId, testData, expiryInSeconds);
      // Wait for the data to expire
      await new Promise(resolve => setTimeout(resolve, (expiryInSeconds + 1) * 1000));
      const retrievedData = await redisService.getSocketData(socketId);
      expect(retrievedData).toBeNull();
    });
  });

  test('should publish and receive events', async () => {
    const testChannel = 'test-channel';
    const testEvent = 'test-event';
    const testData = { message: 'Hello, Redis!' };

    await verifyRedisOperation(async () => {
      const messagePromise = new Promise<any>(resolve => {
        redisService.subscribeToChannel(testChannel, (message) => {
          const { event, data } = JSON.parse(message);
          if (event === testEvent) {
            resolve(data);
          }
        });
      });

      await redisService.publishEvent(testChannel, testEvent, testData);
      const receivedData = await messagePromise;
      expect(receivedData).toEqual(testData);
    });
  });

  test('should handle connection failures gracefully', async () => {
    // Simulate a connection failure by using an invalid configuration
    const invalidConfig = { ...SOCKET_REDIS_CONFIG, port: 9999 };
    const invalidRedisClient = new Redis(invalidConfig);

    await expect(invalidRedisClient.connect()).rejects.toThrow();
    invalidRedisClient.disconnect();
  });
});