import { ISocketUser, NetworkUpdatePayload } from '../types/socket.types';
import { RedisService } from '../services/redisService';
import EventEmitter from '../services/eventEmitter';
import { IConnection } from '../../../shared/interfaces/connection.interface';
import { socketLogger } from '../utils/logger';
import { SocketError, SocketErrorCode, createSocketError } from '../utils/errorHandler';
import { recordMetric } from '../utils/metrics';

/**
 * ConnectionHandler class for managing WebSocket connection events in the Pollen8 platform
 * @description Handles real-time connection events, enabling instant updates for network changes and connection status modifications
 * @requirements Real-time Updates (Technical Specification/1.2 Scope/Core Functionalities/2)
 * @requirements Industry Focus (Technical Specification/1.1 System Objectives)
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives)
 */
export class ConnectionHandler {
  private redisService: RedisService;
  private eventEmitter: EventEmitter;
  private static instance: ConnectionHandler;

  private constructor(eventEmitter: EventEmitter) {
    this.redisService = RedisService.getInstance();
    this.eventEmitter = eventEmitter;
  }

  /**
   * Returns the singleton instance of ConnectionHandler
   * @param {EventEmitter} eventEmitter - EventEmitter instance
   * @returns {ConnectionHandler} Singleton instance of ConnectionHandler
   */
  public static getInstance(eventEmitter: EventEmitter): ConnectionHandler {
    if (!ConnectionHandler.instance) {
      ConnectionHandler.instance = new ConnectionHandler(eventEmitter);
    }
    return ConnectionHandler.instance;
  }

  /**
   * Sets up connection event listeners for a socket
   * @param {ISocketUser} socket - Socket instance with user information
   * @returns {void}
   */
  public handleConnection(socket: ISocketUser): void {
    socket.on('connectionRequest', (targetUserId: string) => this.handleConnectionRequest(socket, targetUserId));
    socket.on('connectionAccept', (connectionId: string) => this.handleConnectionAccept(socket, connectionId));
    socket.on('connectionReject', (connectionId: string) => this.handleConnectionReject(socket, connectionId));
    socketLogger.debug(`Connection event listeners set up for socket ${socket.id}`);
  }

  /**
   * Handles a new connection request between users
   * @param {ISocketUser} socket - Socket instance of the requesting user
   * @param {string} targetUserId - ID of the user receiving the connection request
   * @returns {Promise<void>}
   */
  private async handleConnectionRequest(socket: ISocketUser, targetUserId: string): Promise<void> {
    try {
      // Validate target user ID
      if (!targetUserId) {
        throw createSocketError(SocketErrorCode.INVALID_INPUT, 'Invalid target user ID');
      }

      // Check if connection already exists
      const existingConnection = await this.redisService.getSocketData(`connection:${socket.userId}:${targetUserId}`);
      if (existingConnection) {
        throw createSocketError(SocketErrorCode.DUPLICATE_CONNECTION, 'Connection already exists');
      }

      // Create new connection request
      const connectionRequest: IConnection = {
        id: `${socket.userId}:${targetUserId}`,
        requesterId: socket.userId,
        targetId: targetUserId,
        status: 'pending',
        createdAt: new Date(),
      };

      // Cache connection data in Redis
      await this.redisService.setSocketData(`connection:${connectionRequest.id}`, connectionRequest, 86400); // 24 hours expiry

      // Notify target user
      this.eventEmitter.emitNetworkUpdate({
        nodes: [{ id: socket.userId, type: 'user' }],
        links: [{ source: socket.userId, target: targetUserId, type: 'pending' }],
        industry: socket.industries[0], // Assuming the first industry for simplicity
      });

      socketLogger.info(`Connection request sent from ${socket.userId} to ${targetUserId}`);
      recordMetric('connection_request_sent', { requesterId: socket.userId, targetId: targetUserId });
    } catch (error) {
      socketLogger.error('Failed to handle connection request', error);
      socket.emit('error', { message: error.message });
    }
  }

  /**
   * Handles the acceptance of a connection request
   * @param {ISocketUser} socket - Socket instance of the accepting user
   * @param {string} connectionId - ID of the connection being accepted
   * @returns {Promise<void>}
   */
  private async handleConnectionAccept(socket: ISocketUser, connectionId: string): Promise<void> {
    try {
      // Validate connection ID
      if (!connectionId) {
        throw createSocketError(SocketErrorCode.INVALID_INPUT, 'Invalid connection ID');
      }

      // Retrieve connection data
      const connection: IConnection = await this.redisService.getSocketData(`connection:${connectionId}`);
      if (!connection || connection.targetId !== socket.userId) {
        throw createSocketError(SocketErrorCode.INVALID_CONNECTION, 'Invalid connection or unauthorized action');
      }

      // Update connection status
      connection.status = 'accepted';
      connection.acceptedAt = new Date();
      await this.redisService.setSocketData(`connection:${connectionId}`, connection);

      // Update network values for both users
      await this.updateNetworkValue(connection.requesterId, 3.14);
      await this.updateNetworkValue(connection.targetId, 3.14);

      // Emit connection accepted events
      const networkUpdate: NetworkUpdatePayload = {
        nodes: [
          { id: connection.requesterId, type: 'user' },
          { id: connection.targetId, type: 'user' },
        ],
        links: [{ source: connection.requesterId, target: connection.targetId, type: 'accepted' }],
        industry: socket.industries[0], // Assuming the first industry for simplicity
      };
      this.eventEmitter.emitNetworkUpdate(networkUpdate);

      socketLogger.info(`Connection accepted: ${connectionId}`);
      recordMetric('connection_accepted', { connectionId });
    } catch (error) {
      socketLogger.error('Failed to handle connection acceptance', error);
      socket.emit('error', { message: error.message });
    }
  }

  /**
   * Handles the rejection of a connection request
   * @param {ISocketUser} socket - Socket instance of the rejecting user
   * @param {string} connectionId - ID of the connection being rejected
   * @returns {Promise<void>}
   */
  private async handleConnectionReject(socket: ISocketUser, connectionId: string): Promise<void> {
    try {
      // Validate connection ID
      if (!connectionId) {
        throw createSocketError(SocketErrorCode.INVALID_INPUT, 'Invalid connection ID');
      }

      // Retrieve connection data
      const connection: IConnection = await this.redisService.getSocketData(`connection:${connectionId}`);
      if (!connection || connection.targetId !== socket.userId) {
        throw createSocketError(SocketErrorCode.INVALID_CONNECTION, 'Invalid connection or unauthorized action');
      }

      // Update connection status to rejected
      connection.status = 'rejected';
      connection.rejectedAt = new Date();
      await this.redisService.setSocketData(`connection:${connectionId}`, connection, 86400); // Keep for 24 hours

      // Notify relevant users
      const networkUpdate: NetworkUpdatePayload = {
        nodes: [
          { id: connection.requesterId, type: 'user' },
          { id: connection.targetId, type: 'user' },
        ],
        links: [], // Remove the link to represent rejection
        industry: socket.industries[0], // Assuming the first industry for simplicity
      };
      this.eventEmitter.emitNetworkUpdate(networkUpdate);

      socketLogger.info(`Connection rejected: ${connectionId}`);
      recordMetric('connection_rejected', { connectionId });
    } catch (error) {
      socketLogger.error('Failed to handle connection rejection', error);
      socket.emit('error', { message: error.message });
    }
  }

  /**
   * Updates a user's network value based on connection changes
   * @param {string} userId - ID of the user whose network value is being updated
   * @param {number} change - The change in network value
   * @returns {Promise<void>}
   */
  private async updateNetworkValue(userId: string, change: number): Promise<void> {
    try {
      // Retrieve current network value
      const currentValue = await this.redisService.getSocketData(`networkValue:${userId}`) || 0;
      const newValue = currentValue + change;

      // Update user's network value in Redis
      await this.redisService.setSocketData(`networkValue:${userId}`, newValue);

      // Emit network value change event
      this.eventEmitter.emitNetworkValueChange({
        userId,
        newValue,
        change,
      });

      socketLogger.debug(`Network value updated for user ${userId}: ${currentValue} -> ${newValue}`);
      recordMetric('network_value_updated', { userId, oldValue: currentValue, newValue });
    } catch (error) {
      socketLogger.error(`Failed to update network value for user ${userId}`, error);
      throw createSocketError(SocketErrorCode.UPDATE_FAILED, 'Failed to update network value');
    }
  }
}

// Export the ConnectionHandler class
export default ConnectionHandler;