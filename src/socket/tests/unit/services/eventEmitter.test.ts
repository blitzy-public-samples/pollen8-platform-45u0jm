import { Server } from 'socket.io';
import { EventEmitter } from '../../../src/services/eventEmitter';
import { RedisService } from '../../../src/services/redisService';
import { socketLogger } from '../../../src/utils/logger';
import { IServerToClientEvents, NetworkUpdatePayload, NetworkValuePayload, InviteClickPayload } from '../../../src/types/socket.types';
import { SocketErrorCode, createSocketError } from '../../../src/utils/errorHandler';

// Mock dependencies
jest.mock('socket.io');
jest.mock('../../../src/services/redisService');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/metrics');

describe('EventEmitter', () => {
  let mockServer: jest.Mocked<Server>;
  let mockRedisService: jest.Mocked<RedisService>;
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();

    // Create mock instances
    mockServer = new Server() as jest.Mocked<Server>;
    mockRedisService = {
      getInstance: jest.fn().mockReturnThis(),
      subscribeToChannel: jest.fn(),
      publishEvent: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    // Mock RedisService.getInstance to return our mock
    (RedisService.getInstance as jest.Mock).mockReturnValue(mockRedisService);

    // Initialize EventEmitter instance
    eventEmitter = EventEmitter.getInstance(mockServer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = EventEmitter.getInstance(mockServer);
      const instance2 = EventEmitter.getInstance(mockServer);
      expect(instance1).toBe(instance2);
    });
  });

  describe('emitNetworkUpdate', () => {
    it('should emit to correct industries', async () => {
      const mockPayload: NetworkUpdatePayload = {
        nodes: [{ id: 'user1', industry: 'tech' }],
        links: [{ source: 'user1', target: 'user2' }],
        industry: 'tech'
      };

      mockServer.to.mockReturnThis();
      mockServer.emit = jest.fn();

      await eventEmitter.emitNetworkUpdate(mockPayload);

      expect(mockServer.to).toHaveBeenCalledWith('industry:tech');
      expect(mockServer.emit).toHaveBeenCalledWith('networkUpdate', mockPayload);
      expect(socketLogger.info).toHaveBeenCalledWith('Network update emitted for industry: tech');
    });

    it('should handle errors and throw SocketError', async () => {
      const mockPayload: NetworkUpdatePayload = {
        nodes: [{ id: 'user1', industry: 'tech' }],
        links: [{ source: 'user1', target: 'user2' }],
        industry: 'tech'
      };

      mockServer.to.mockImplementation(() => {
        throw new Error('Emission failed');
      });

      await expect(eventEmitter.emitNetworkUpdate(mockPayload)).rejects.toThrow(
        createSocketError(SocketErrorCode.EMISSION_FAILED, 'Failed to emit network update')
      );
      expect(socketLogger.error).toHaveBeenCalledWith('Failed to emit network update', expect.any(Error));
    });
  });

  describe('emitNetworkValueChange', () => {
    it('should emit to specific user', async () => {
      const mockPayload: NetworkValuePayload = {
        userId: 'user1',
        newValue: 6.28,
        change: 3.14
      };

      mockServer.to.mockReturnThis();
      mockServer.emit = jest.fn();

      await eventEmitter.emitNetworkValueChange(mockPayload);

      expect(mockServer.to).toHaveBeenCalledWith('user:user1');
      expect(mockServer.emit).toHaveBeenCalledWith('networkValueChange', mockPayload);
      expect(socketLogger.info).toHaveBeenCalledWith('Network value change emitted for user: user1');
    });

    it('should handle errors and throw SocketError', async () => {
      const mockPayload: NetworkValuePayload = {
        userId: 'user1',
        newValue: 6.28,
        change: 3.14
      };

      mockServer.to.mockImplementation(() => {
        throw new Error('Emission failed');
      });

      await expect(eventEmitter.emitNetworkValueChange(mockPayload)).rejects.toThrow(
        createSocketError(SocketErrorCode.EMISSION_FAILED, 'Failed to emit network value change')
      );
      expect(socketLogger.error).toHaveBeenCalledWith('Failed to emit network value change', expect.any(Error));
    });
  });

  describe('emitInviteClick', () => {
    it('should emit to invite creator', async () => {
      const mockPayload: InviteClickPayload = {
        inviteId: 'invite1',
        clickCount: 5
      };

      mockServer.to.mockReturnThis();
      mockServer.emit = jest.fn();

      await eventEmitter.emitInviteClick(mockPayload);

      expect(mockServer.to).toHaveBeenCalledWith('invite:invite1');
      expect(mockServer.emit).toHaveBeenCalledWith('inviteClicked', mockPayload);
      expect(socketLogger.info).toHaveBeenCalledWith('Invite click emitted for invite: invite1');
    });

    it('should handle errors and throw SocketError', async () => {
      const mockPayload: InviteClickPayload = {
        inviteId: 'invite1',
        clickCount: 5
      };

      mockServer.to.mockImplementation(() => {
        throw new Error('Emission failed');
      });

      await expect(eventEmitter.emitInviteClick(mockPayload)).rejects.toThrow(
        createSocketError(SocketErrorCode.EMISSION_FAILED, 'Failed to emit invite click')
      );
      expect(socketLogger.error).toHaveBeenCalledWith('Failed to emit invite click', expect.any(Error));
    });
  });

  describe('subscribeToRedisChannels', () => {
    it('should subscribe to all required Redis channels', async () => {
      await eventEmitter.subscribeToRedisChannels();

      expect(mockRedisService.subscribeToChannel).toHaveBeenCalledTimes(3);
      expect(mockRedisService.subscribeToChannel).toHaveBeenCalledWith('network_updates', expect.any(Function));
      expect(mockRedisService.subscribeToChannel).toHaveBeenCalledWith('network_value_changes', expect.any(Function));
      expect(mockRedisService.subscribeToChannel).toHaveBeenCalledWith('invite_clicks', expect.any(Function));
      expect(socketLogger.info).toHaveBeenCalledWith('Subscribed to Redis channels for event emission');
    });

    it('should handle Redis publish errors', async () => {
      mockRedisService.subscribeToChannel.mockRejectedValue(new Error('Redis error'));

      await expect(eventEmitter.subscribeToRedisChannels()).rejects.toThrow(
        createSocketError(SocketErrorCode.SUBSCRIPTION_FAILED, 'Failed to subscribe to Redis channels')
      );
      expect(socketLogger.error).toHaveBeenCalledWith('Failed to subscribe to Redis channels', expect.any(Error));
    });
  });

  describe('initializeEventListeners', () => {
    it('should set up socket event listeners', () => {
      const mockSocket = {
        id: 'socket1',
        userId: 'user1',
        on: jest.fn(),
        join: jest.fn(),
      };

      mockServer.on = jest.fn().mockImplementation((event, callback) => {
        if (event === 'connection') {
          callback(mockSocket);
        }
      });

      eventEmitter.initializeEventListeners();

      expect(mockServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('subscribeToNetwork', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('unsubscribeFromNetwork', expect.any(Function));
      expect(mockSocket.join).toHaveBeenCalledWith('user:user1');
      expect(socketLogger.debug).toHaveBeenCalledWith('Socket socket1 joined user room: user:user1');
    });
  });
});