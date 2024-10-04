import { ISocketUser, InviteClickPayload } from '../types/socket.types';
import { RedisService } from '../services/redisService';
import EventEmitter from '../services/eventEmitter';
import { IInvite } from '../../../shared/interfaces/invite.interface';
import { socketLogger } from '../utils/logger';
import { recordMetric } from '../utils/metrics';
import { SocketError, SocketErrorCode, createSocketError } from '../utils/errorHandler';

/**
 * InviteHandler class for managing WebSocket events related to invites in the Pollen8 platform
 * @description Handles real-time invite-related events such as invite clicks and analytics updates
 * @requirements Invitation System (Technical Specification/1.2 Scope/Core Functionalities/3)
 * @requirements Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives)
 */
export class InviteHandler {
  private redisService: RedisService;
  private eventEmitter: EventEmitter;

  /**
   * Initializes the InviteHandler with required services
   * @param {RedisService} redisService - Redis service for data operations
   * @param {EventEmitter} eventEmitter - Event emission service
   */
  constructor(redisService: RedisService, eventEmitter: EventEmitter) {
    this.redisService = redisService;
    this.eventEmitter = eventEmitter;
  }

  /**
   * Handles an invite link click event, updates analytics, and emits updates
   * @param {ISocketUser} socket - Socket instance of the user
   * @param {string} inviteId - ID of the clicked invite
   * @returns {Promise<void>}
   */
  public async handleInviteClick(socket: ISocketUser, inviteId: string): Promise<void> {
    try {
      // Validate invite ID
      if (!inviteId || typeof inviteId !== 'string') {
        throw createSocketError(SocketErrorCode.INVALID_INPUT, 'Invalid invite ID');
      }

      // Update click count in Redis
      const clickCount = await this.redisService.client.incr(`invite:${inviteId}:clicks`);

      // Update daily click data
      const today = new Date().toISOString().split('T')[0];
      await this.redisService.client.hincrby(`invite:${inviteId}:daily_clicks`, today, 1);

      // Prepare payload for event emission
      const payload: InviteClickPayload = {
        inviteId,
        clickCount,
      };

      // Emit invite click event to creator
      await this.eventEmitter.emitInviteClick(payload);

      // Log the event and record metric
      socketLogger.info(`Invite click handled for invite: ${inviteId}`);
      recordMetric('invite_click_handled', { inviteId, clickCount });

    } catch (error) {
      socketLogger.error(`Error handling invite click for invite: ${inviteId}`, error);
      if (error instanceof SocketError) {
        throw error;
      }
      throw createSocketError(SocketErrorCode.INTERNAL_ERROR, 'Failed to handle invite click');
    }
  }

  /**
   * Handles requests for real-time invite analytics data
   * @param {ISocketUser} socket - Socket instance of the requesting user
   * @param {string} inviteId - ID of the invite for which analytics are requested
   * @returns {Promise<void>}
   */
  public async handleInviteAnalyticsRequest(socket: ISocketUser, inviteId: string): Promise<void> {
    try {
      // Validate invite ID and user authorization
      if (!inviteId || typeof inviteId !== 'string') {
        throw createSocketError(SocketErrorCode.INVALID_INPUT, 'Invalid invite ID');
      }

      // TODO: Implement authorization check to ensure the requesting user owns the invite

      // Retrieve analytics data from Redis
      const clickCount = await this.redisService.client.get(`invite:${inviteId}:clicks`) || '0';
      const dailyClicks = await this.redisService.client.hgetall(`invite:${inviteId}:daily_clicks`) || {};

      // Prepare analytics data
      const analyticsData: Partial<IInvite> = {
        id: inviteId,
        clickCount: parseInt(clickCount, 10),
        dailyClickData: Object.entries(dailyClicks).reduce((acc, [date, clicks]) => {
          acc[date] = parseInt(clicks, 10);
          return acc;
        }, {} as Record<string, number>),
      };

      // Emit analytics data to requesting user
      socket.emit('inviteAnalytics', analyticsData);

      // Log the event and record metric
      socketLogger.info(`Invite analytics sent for invite: ${inviteId}`);
      recordMetric('invite_analytics_sent', { inviteId });

    } catch (error) {
      socketLogger.error(`Error handling invite analytics request for invite: ${inviteId}`, error);
      if (error instanceof SocketError) {
        throw error;
      }
      throw createSocketError(SocketErrorCode.INTERNAL_ERROR, 'Failed to handle invite analytics request');
    }
  }
}

export default InviteHandler;