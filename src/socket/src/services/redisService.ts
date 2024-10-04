import Redis from 'ioredis';
import { createAdapter } from 'socket.io-redis';
import { SOCKET_REDIS_CONFIG } from '../config/redis';
import { socketLogger } from '../utils/logger';
import { SocketError, SocketErrorCode, createSocketError } from '../utils/errorHandler';

/**
 * RedisService class providing Redis client functionality and utilities for the WebSocket server
 * @description Enables real-time data synchronization and temporary data storage for WebSocket connections
 * @requirements Real-time Updates (Technical Specification/2.4.2 Network Value Calculation)
 * @requirements High Performance (Technical Specification/2.2 High-Level Architecture Diagram)
 * @requirements Scalability (Technical Specification/6.1 Deployment Environment)
 */
export class RedisService {
  private client: Redis.Redis;
  private static instance: RedisService;

  private constructor() {
    this.client = new Redis(SOCKET_REDIS_CONFIG);
  }

  /**
   * Returns the singleton instance of RedisService
   * @returns {RedisService} Singleton instance of the service
   */
  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Establishes connection to Redis server using configuration
   * @returns {Promise<void>} Promise resolving when connection is established
   */
  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      socketLogger.info('Redis connection established successfully');
    } catch (error) {
      socketLogger.error('Failed to connect to Redis', error);
      throw createSocketError(SocketErrorCode.INTERNAL_ERROR, 'Redis connection failed');
    }
  }

  /**
   * Gracefully closes the Redis connection
   * @returns {Promise<void>} Promise resolving when disconnection is complete
   */
  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      socketLogger.info('Redis connection closed successfully');
    } catch (error) {
      socketLogger.error('Error while disconnecting from Redis', error);
      throw createSocketError(SocketErrorCode.INTERNAL_ERROR, 'Redis disconnection failed');
    }
  }

  /**
   * Stores socket-specific data in Redis with optional expiry
   * @param {string} socketId - The ID of the socket
   * @param {any} data - The data to be stored
   * @param {number} expiry - Optional expiry time in seconds
   * @returns {Promise<void>} Promise resolving when data is stored
   */
  public async setSocketData(socketId: string, data: any, expiry?: number): Promise<void> {
    try {
      const serializedData = JSON.stringify(data);
      if (expiry) {
        await this.client.setex(`socket:${socketId}`, expiry, serializedData);
      } else {
        await this.client.set(`socket:${socketId}`, serializedData);
      }
      socketLogger.debug(`Socket data stored for ${socketId}`);
    } catch (error) {
      socketLogger.error(`Failed to store socket data for ${socketId}`, error);
      throw createSocketError(SocketErrorCode.INTERNAL_ERROR, 'Failed to store socket data');
    }
  }

  /**
   * Retrieves socket-specific data from Redis
   * @param {string} socketId - The ID of the socket
   * @returns {Promise<any>} Promise resolving with retrieved data
   */
  public async getSocketData(socketId: string): Promise<any> {
    try {
      const data = await this.client.get(`socket:${socketId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      socketLogger.error(`Failed to retrieve socket data for ${socketId}`, error);
      throw createSocketError(SocketErrorCode.INTERNAL_ERROR, 'Failed to retrieve socket data');
    }
  }

  /**
   * Publishes an event to a Redis channel for real-time updates
   * @param {string} channel - The Redis channel to publish to
   * @param {string} event - The event name
   * @param {any} data - The data to be published
   * @returns {Promise<void>} Promise resolving when event is published
   */
  public async publishEvent(channel: string, event: string, data: any): Promise<void> {
    try {
      const payload = JSON.stringify({ event, data });
      await this.client.publish(channel, payload);
      socketLogger.debug(`Event published to channel ${channel}: ${event}`);
    } catch (error) {
      socketLogger.error(`Failed to publish event to channel ${channel}`, error);
      throw createSocketError(SocketErrorCode.INTERNAL_ERROR, 'Failed to publish event');
    }
  }

  /**
   * Subscribes to a Redis channel for receiving real-time updates
   * @param {string} channel - The Redis channel to subscribe to
   * @param {function} callback - The callback function to handle received messages
   * @returns {Promise<void>} Promise resolving when subscription is established
   */
  public async subscribeToChannel(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.client.subscribe(channel);
      this.client.on('message', (ch, message) => {
        if (ch === channel) {
          callback(message);
        }
      });
      socketLogger.info(`Subscribed to Redis channel: ${channel}`);
    } catch (error) {
      socketLogger.error(`Failed to subscribe to Redis channel ${channel}`, error);
      throw createSocketError(SocketErrorCode.INTERNAL_ERROR, 'Failed to subscribe to channel');
    }
  }

  /**
   * Creates a Redis adapter for Socket.io
   * @returns {ReturnType<typeof createAdapter>} Socket.io Redis adapter
   */
  public createSocketAdapter(): ReturnType<typeof createAdapter> {
    return createAdapter(SOCKET_REDIS_CONFIG);
  }
}

// Export the singleton instance
export const redisService = RedisService.getInstance();