import { Server } from 'socket.io';
import { IServerToClientEvents, ISocketUser, NetworkUpdatePayload, NetworkValuePayload, InviteClickPayload } from '../types/socket.types';
import { RedisService } from './redisService';
import { socketLogger } from '../utils/logger';
import { recordMetric } from '../utils/metrics';
import { SocketError, SocketErrorCode, createSocketError } from '../utils/errorHandler';

/**
 * EventEmitter class for handling WebSocket event emissions in the Pollen8 platform
 * @description Provides a centralized system for emitting real-time updates to connected clients
 * @requirements Real-time Updates (Technical Specification/2.4.2 Network Value Calculation)
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives)
 * @requirements Industry Focus (Technical Specification/1.1 System Objectives)
 */
export class EventEmitter {
  private io: Server<any, IServerToClientEvents>;
  private redisService: RedisService;
  private static instance: EventEmitter;

  private constructor(io: Server) {
    this.io = io;
    this.redisService = RedisService.getInstance();
  }

  /**
   * Returns the singleton instance of EventEmitter
   * @param {Server} io - Socket.IO server instance
   * @returns {EventEmitter} Singleton instance of EventEmitter
   */
  public static getInstance(io: Server): EventEmitter {
    if (!EventEmitter.instance) {
      EventEmitter.instance = new EventEmitter(io);
    }
    return EventEmitter.instance;
  }

  /**
   * Emits network graph updates to relevant clients based on industry
   * @param {NetworkUpdatePayload} data - Network update payload
   * @returns {Promise<void>}
   */
  public async emitNetworkUpdate(data: NetworkUpdatePayload): Promise<void> {
    try {
      await this.emitToIndustries([data.industry], 'networkUpdate', data);
      socketLogger.info(`Network update emitted for industry: ${data.industry}`);
      recordMetric('network_update_emitted', { industry: data.industry });
    } catch (error) {
      socketLogger.error('Failed to emit network update', error);
      throw createSocketError(SocketErrorCode.EMISSION_FAILED, 'Failed to emit network update');
    }
  }

  /**
   * Emits network value changes to affected users
   * @param {NetworkValuePayload} data - Network value change payload
   * @returns {Promise<void>}
   */
  public async emitNetworkValueChange(data: NetworkValuePayload): Promise<void> {
    try {
      const room = `user:${data.userId}`;
      this.io.to(room).emit('networkValueChange', data);
      socketLogger.info(`Network value change emitted for user: ${data.userId}`);
      recordMetric('network_value_change_emitted', { userId: data.userId, change: data.change });
    } catch (error) {
      socketLogger.error('Failed to emit network value change', error);
      throw createSocketError(SocketErrorCode.EMISSION_FAILED, 'Failed to emit network value change');
    }
  }

  /**
   * Emits invite link click events to invite creators
   * @param {InviteClickPayload} data - Invite click payload
   * @returns {Promise<void>}
   */
  public async emitInviteClick(data: InviteClickPayload): Promise<void> {
    try {
      const room = `invite:${data.inviteId}`;
      this.io.to(room).emit('inviteClicked', data);
      socketLogger.info(`Invite click emitted for invite: ${data.inviteId}`);
      recordMetric('invite_click_emitted', { inviteId: data.inviteId, clickCount: data.clickCount });
    } catch (error) {
      socketLogger.error('Failed to emit invite click', error);
      throw createSocketError(SocketErrorCode.EMISSION_FAILED, 'Failed to emit invite click');
    }
  }

  /**
   * Helper method to emit events to specific industry rooms
   * @param {string[]} industries - Array of industry names
   * @param {keyof IServerToClientEvents} event - Event name
   * @param {any} data - Event data
   * @returns {void}
   */
  private emitToIndustries(industries: string[], event: keyof IServerToClientEvents, data: any): void {
    industries.forEach(industry => {
      const room = `industry:${industry}`;
      this.io.to(room).emit(event, data);
    });
  }

  /**
   * Subscribes to Redis channels for distributed event emission
   * @returns {Promise<void>}
   */
  public async subscribeToRedisChannels(): Promise<void> {
    try {
      await this.redisService.subscribeToChannel('network_updates', (message) => {
        const { industry, data } = JSON.parse(message);
        this.emitNetworkUpdate(data);
      });

      await this.redisService.subscribeToChannel('network_value_changes', (message) => {
        const data = JSON.parse(message);
        this.emitNetworkValueChange(data);
      });

      await this.redisService.subscribeToChannel('invite_clicks', (message) => {
        const data = JSON.parse(message);
        this.emitInviteClick(data);
      });

      socketLogger.info('Subscribed to Redis channels for event emission');
    } catch (error) {
      socketLogger.error('Failed to subscribe to Redis channels', error);
      throw createSocketError(SocketErrorCode.SUBSCRIPTION_FAILED, 'Failed to subscribe to Redis channels');
    }
  }

  /**
   * Initializes event listeners for socket connections
   * @returns {void}
   */
  public initializeEventListeners(): void {
    this.io.on('connection', (socket: ISocketUser) => {
      socket.on('subscribeToNetwork', (industries: string[]) => {
        industries.forEach(industry => {
          socket.join(`industry:${industry}`);
        });
        socketLogger.debug(`Socket ${socket.id} subscribed to industries: ${industries.join(', ')}`);
      });

      socket.on('unsubscribeFromNetwork', (industries: string[]) => {
        industries.forEach(industry => {
          socket.leave(`industry:${industry}`);
        });
        socketLogger.debug(`Socket ${socket.id} unsubscribed from industries: ${industries.join(', ')}`);
      });

      socket.join(`user:${socket.userId}`);
      socketLogger.debug(`Socket ${socket.id} joined user room: user:${socket.userId}`);
    });
  }
}

// Export the EventEmitter class
export default EventEmitter;