import { ISocketUser, NetworkValuePayload } from '../types/socket.types';
import { RedisService } from '../services/redisService';
import EventEmitter from '../services/eventEmitter';
import { BASE_CONNECTION_VALUE, NETWORK_VALUE_PRECISION } from '../../../shared/constants/networkValue';
import { socketLogger } from '../utils/logger';
import { recordMetric } from '../utils/metrics';
import { SocketError, SocketErrorCode, createSocketError } from '../utils/errorHandler';

/**
 * NetworkValueHandler class responsible for managing and broadcasting real-time network value updates
 * @description Handles the calculation and distribution of network value changes in the Pollen8 platform
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives)
 * @requirements Real-time Updates (Technical Specification/2.4.2 Network Value Calculation)
 * @requirements Industry Focus (Technical Specification/1.1 System Objectives)
 */
export class NetworkValueHandler {
  private redisService: RedisService;
  private eventEmitter: EventEmitter;

  /**
   * Initializes the NetworkValueHandler with required services
   * @param redisService Instance of RedisService for data synchronization
   * @param eventEmitter Instance of EventEmitter for broadcasting updates
   */
  constructor(redisService: RedisService, eventEmitter: EventEmitter) {
    this.redisService = redisService;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Handles the calculation and broadcasting of network value updates
   * @param socket The socket instance of the connected user
   * @param userId The ID of the user whose network value is being updated
   * @param industries The industries associated with the user
   * @returns Promise<void>
   */
  public async handleNetworkValueUpdate(socket: ISocketUser, userId: string, industries: string[]): Promise<void> {
    try {
      const connectionCount = await this.getConnectionCount(userId);
      const newValue = this.calculateNetworkValue(connectionCount);
      const oldValue = await this.getCurrentNetworkValue(userId);

      await this.updateNetworkValue(userId, newValue);
      await this.broadcastValueChange(userId, newValue, oldValue, industries);

      socketLogger.info(`Network value updated for user ${userId}: ${oldValue} -> ${newValue}`);
      recordMetric('network_value_updated', { userId, oldValue, newValue });
    } catch (error) {
      socketLogger.error(`Error updating network value for user ${userId}`, error);
      throw createSocketError(SocketErrorCode.NETWORK_VALUE_UPDATE_FAILED, 'Failed to update network value');
    }
  }

  /**
   * Calculates the new network value based on connection count
   * @param connectionCount The number of connections for the user
   * @returns The calculated network value
   */
  private calculateNetworkValue(connectionCount: number): number {
    const rawValue = connectionCount * BASE_CONNECTION_VALUE;
    return Number(rawValue.toFixed(NETWORK_VALUE_PRECISION));
  }

  /**
   * Retrieves the current connection count for a user from Redis
   * @param userId The ID of the user
   * @returns Promise resolving to the connection count
   */
  private async getConnectionCount(userId: string): Promise<number> {
    try {
      const count = await this.redisService.getSocketData(`connectionCount:${userId}`);
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      socketLogger.error(`Failed to retrieve connection count for user ${userId}`, error);
      throw createSocketError(SocketErrorCode.REDIS_OPERATION_FAILED, 'Failed to retrieve connection count');
    }
  }

  /**
   * Retrieves the current network value for a user from Redis
   * @param userId The ID of the user
   * @returns Promise resolving to the current network value
   */
  private async getCurrentNetworkValue(userId: string): Promise<number> {
    try {
      const value = await this.redisService.getSocketData(`networkValue:${userId}`);
      return value ? parseFloat(value) : 0;
    } catch (error) {
      socketLogger.error(`Failed to retrieve current network value for user ${userId}`, error);
      throw createSocketError(SocketErrorCode.REDIS_OPERATION_FAILED, 'Failed to retrieve current network value');
    }
  }

  /**
   * Updates the network value for a user in Redis
   * @param userId The ID of the user
   * @param newValue The new network value to be stored
   * @returns Promise<void>
   */
  private async updateNetworkValue(userId: string, newValue: number): Promise<void> {
    try {
      await this.redisService.setSocketData(`networkValue:${userId}`, newValue.toString());
    } catch (error) {
      socketLogger.error(`Failed to update network value for user ${userId}`, error);
      throw createSocketError(SocketErrorCode.REDIS_OPERATION_FAILED, 'Failed to update network value');
    }
  }

  /**
   * Broadcasts network value changes to relevant clients
   * @param userId The ID of the user whose network value changed
   * @param newValue The new network value
   * @param oldValue The previous network value
   * @param industries The industries associated with the user
   * @returns Promise<void>
   */
  private async broadcastValueChange(userId: string, newValue: number, oldValue: number, industries: string[]): Promise<void> {
    const payload: NetworkValuePayload = {
      userId,
      newValue,
      change: newValue - oldValue
    };

    try {
      await this.eventEmitter.emitNetworkValueChange(payload);
      await this.publishIndustryUpdate(industries, payload);
    } catch (error) {
      socketLogger.error(`Failed to broadcast network value change for user ${userId}`, error);
      throw createSocketError(SocketErrorCode.BROADCAST_FAILED, 'Failed to broadcast network value change');
    }
  }

  /**
   * Publishes industry-specific updates to Redis for distributed processing
   * @param industries The industries associated with the user
   * @param payload The network value change payload
   * @returns Promise<void>
   */
  private async publishIndustryUpdate(industries: string[], payload: NetworkValuePayload): Promise<void> {
    try {
      for (const industry of industries) {
        await this.redisService.publishEvent(`industry:${industry}`, 'networkValueChange', payload);
      }
    } catch (error) {
      socketLogger.error('Failed to publish industry update to Redis', error);
      throw createSocketError(SocketErrorCode.REDIS_OPERATION_FAILED, 'Failed to publish industry update');
    }
  }
}

/**
 * @fileoverview This TypeScript file implements the NetworkValueHandler class for the Pollen8 platform's WebSocket server.
 * It manages real-time network value calculations and updates, addressing key requirements for quantifiable networking
 * and industry-focused updates.
 * 
 * Key requirements addressed:
 * 1. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Implemented network value calculation based on connection count and BASE_CONNECTION_VALUE
 * 2. Real-time Updates (Technical Specification/2.4.2 Network Value Calculation)
 *    - Provided methods for real-time network value updates and broadcasting
 * 3. Industry Focus (Technical Specification/1.1 System Objectives)
 *    - Included industry-specific update publishing for targeted real-time updates
 * 
 * This handler ensures that network value changes are calculated accurately, stored efficiently using Redis,
 * and broadcast in real-time to relevant clients, maintaining the platform's focus on quantifiable networking
 * and industry-specific interactions.
 */