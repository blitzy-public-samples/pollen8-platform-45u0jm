import { RedisService } from '../../../src/services/redisService';
import { SOCKET_REDIS_CONFIG } from '../../../src/config/redis';
import { socketLogger } from '../../../src/utils/logger';
import { SocketErrorCode } from '../../../src/utils/errorHandler';
import Redis from 'ioredis-mock';

// Mock the ioredis module
jest.mock('ioredis', () => require('ioredis-mock'));

// Mock the socket.io-redis module
jest.mock('socket.io-redis', () => ({
  createAdapter: jest.fn().mockReturnValue({})
}));

describe('RedisService', () => {
  let redisService: RedisService;
  let mockRedisClient: jest.Mocked<Redis.Redis>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    // Create new mockRedisClient
    mockRedisClient = new Redis() as jest.Mocked<Redis.Redis>;
    // Create fresh RedisService instance
    redisService = RedisService.getInstance();
    // Replace the real Redis client with the mock
    (redisService as any).client = mockRedisClient;
  });

  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return the same instance every time', () => {
      const instance1 = RedisService.getInstance();
      const instance2 = RedisService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('connect', () => {
    it('should successfully establish a Redis connection', async () => {
      await redisService.connect();
      expect(mockRedisClient.connect).toHaveBeenCalled();
      expect(socketLogger.info).toHaveBeenCalledWith('Redis connection established successfully');
    });

    it('should throw an error if connection fails', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));
      await expect(redisService.connect()).rejects.toThrow('Redis connection failed');
      expect(socketLogger.error).toHaveBeenCalledWith('Failed to connect to Redis', expect.any(Error));
    });
  });

  describe('disconnect', () => {
    it('should properly close the Redis connection', async () => {
      await redisService.disconnect();
      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect(socketLogger.info).toHaveBeenCalledWith('Redis connection closed successfully');
    });

    it('should throw an error if disconnection fails', async () => {
      mockRedisClient.quit.mockRejectedValue(new Error('Disconnection failed'));
      await expect(redisService.disconnect()).rejects.toThrow('Redis disconnection failed');
      expect(socketLogger.error).toHaveBeenCalledWith('Error while disconnecting from Redis', expect.any(Error));
    });
  });

  describe('setSocketData', () => {
    it('should store socket data with expiration', async () => {
      const socketId = 'test-socket-id';
      const data = { key: 'value' };
      const expiry = 60;

      await redisService.setSocketData(socketId, data, expiry);
      expect(mockRedisClient.setex).toHaveBeenCalledWith(`socket:${socketId}`, expiry, JSON.stringify(data));
      expect(socketLogger.debug).toHaveBeenCalledWith(`Socket data stored for ${socketId}`);
    });

    it('should store socket data without expiration', async () => {
      const socketId = 'test-socket-id';
      const data = { key: 'value' };

      await redisService.setSocketData(socketId, data);
      expect(mockRedisClient.set).toHaveBeenCalledWith(`socket:${socketId}`, JSON.stringify(data));
      expect(socketLogger.debug).toHaveBeenCalledWith(`Socket data stored for ${socketId}`);
    });

    it('should throw an error if storing data fails', async () => {
      mockRedisClient.set.mockRejectedValue(new Error('Storage failed'));
      await expect(redisService.setSocketData('test-socket-id', {})).rejects.toThrow('Failed to store socket data');
      expect(socketLogger.error).toHaveBeenCalledWith('Failed to store socket data for test-socket-id', expect.any(Error));
    });
  });

  describe('getSocketData', () => {
    it('should retrieve previously stored socket data', async () => {
      const socketId = 'test-socket-id';
      const storedData = { key: 'value' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(storedData));

      const result = await redisService.getSocketData(socketId);
      expect(result).toEqual(storedData);
      expect(mockRedisClient.get).toHaveBeenCalledWith(`socket:${socketId}`);
    });

    it('should return null if no data is found', async () => {
      mockRedisClient.get.mockResolvedValue(null);
      const result = await redisService.getSocketData('non-existent-socket-id');
      expect(result).toBeNull();
    });

    it('should throw an error if retrieving data fails', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Retrieval failed'));
      await expect(redisService.getSocketData('test-socket-id')).rejects.toThrow('Failed to retrieve socket data');
      expect(socketLogger.error).toHaveBeenCalledWith('Failed to retrieve socket data for test-socket-id', expect.any(Error));
    });
  });

  describe('publishEvent', () => {
    it('should publish an event to the specified Redis channel', async () => {
      const channel = 'test-channel';
      const event = 'test-event';
      const data = { key: 'value' };

      await redisService.publishEvent(channel, event, data);
      expect(mockRedisClient.publish).toHaveBeenCalledWith(channel, JSON.stringify({ event, data }));
      expect(socketLogger.debug).toHaveBeenCalledWith(`Event published to channel ${channel}: ${event}`);
    });

    it('should throw an error if publishing fails', async () => {
      mockRedisClient.publish.mockRejectedValue(new Error('Publish failed'));
      await expect(redisService.publishEvent('channel', 'event', {})).rejects.toThrow('Failed to publish event');
      expect(socketLogger.error).toHaveBeenCalledWith('Failed to publish event to channel channel', expect.any(Error));
    });
  });

  describe('subscribeToChannel', () => {
    it('should subscribe to a Redis channel and handle messages', async () => {
      const channel = 'test-channel';
      const callback = jest.fn();

      await redisService.subscribeToChannel(channel, callback);
      expect(mockRedisClient.subscribe).toHaveBeenCalledWith(channel);
      expect(socketLogger.info).toHaveBeenCalledWith(`Subscribed to Redis channel: ${channel}`);

      // Simulate receiving a message
      const message = 'test-message';
      mockRedisClient.emit('message', channel, message);
      expect(callback).toHaveBeenCalledWith(message);
    });

    it('should throw an error if subscription fails', async () => {
      mockRedisClient.subscribe.mockRejectedValue(new Error('Subscription failed'));
      await expect(redisService.subscribeToChannel('channel', jest.fn())).rejects.toThrow('Failed to subscribe to channel');
      expect(socketLogger.error).toHaveBeenCalledWith('Failed to subscribe to Redis channel channel', expect.any(Error));
    });
  });

  describe('createSocketAdapter', () => {
    it('should create a Socket.io Redis adapter', () => {
      const adapter = redisService.createSocketAdapter();
      expect(adapter).toBeDefined();
      // Since we mocked createAdapter, we can't test its internals, but we can ensure it was called
      expect(require('socket.io-redis').createAdapter).toHaveBeenCalledWith(SOCKET_REDIS_CONFIG);
    });
  });

  describe('Error Handling', () => {
    it('should use SocketErrorCode for Redis operation errors', async () => {
      mockRedisClient.connect.mockRejectedValue(new Error('Connection error'));
      await expect(redisService.connect()).rejects.toMatchObject({
        code: SocketErrorCode.INTERNAL_ERROR,
        message: 'Redis connection failed'
      });
    });
  });
});