import { InviteHandler } from '../../../src/handlers/inviteHandler';
import { RedisService } from '../../../src/services/redisService';
import EventEmitter from '../../../src/services/eventEmitter';
import { ISocketUser, InviteClickPayload } from '../../../src/types/socket.types';
import { IInvite } from '../../../../../shared/interfaces/invite.interface';
import { SocketError, SocketErrorCode } from '../../../src/utils/errorHandler';

// Mock Redis and EventEmitter
jest.mock('../../../src/services/redisService');
jest.mock('../../../src/services/eventEmitter');

describe('InviteHandler', () => {
  let inviteHandler: InviteHandler;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockEventEmitter: jest.Mocked<EventEmitter>;
  let mockSocket: jest.Mocked<ISocketUser>;

  beforeEach(() => {
    mockRedisService = new RedisService() as jest.Mocked<RedisService>;
    mockEventEmitter = new EventEmitter() as jest.Mocked<EventEmitter>;
    mockSocket = {
      id: 'socket-id',
      user: { id: 'user-id', phoneNumber: '+1234567890' },
      emit: jest.fn(),
    } as unknown as jest.Mocked<ISocketUser>;

    inviteHandler = new InviteHandler(mockRedisService, mockEventEmitter);
  });

  describe('handleInviteClick', () => {
    it('should successfully handle an invite click event', async () => {
      // Arrange
      const inviteId = 'invite-123';
      mockRedisService.client = {
        incr: jest.fn().mockResolvedValue(5),
        hincrby: jest.fn().mockResolvedValue(1),
      } as any;

      // Act
      await inviteHandler.handleInviteClick(mockSocket, inviteId);

      // Assert
      expect(mockRedisService.client.incr).toHaveBeenCalledWith(`invite:${inviteId}:clicks`);
      expect(mockRedisService.client.hincrby).toHaveBeenCalledWith(
        `invite:${inviteId}:daily_clicks`,
        expect.any(String),
        1
      );
      expect(mockEventEmitter.emitInviteClick).toHaveBeenCalledWith({
        inviteId,
        clickCount: 5,
      } as InviteClickPayload);
    });

    it('should throw an error for invalid invite ID', async () => {
      // Arrange
      const invalidInviteId = '';

      // Act & Assert
      await expect(inviteHandler.handleInviteClick(mockSocket, invalidInviteId)).rejects.toThrow(SocketError);
      await expect(inviteHandler.handleInviteClick(mockSocket, invalidInviteId)).rejects.toHaveProperty(
        'code',
        SocketErrorCode.INVALID_INPUT
      );
    });

    it('should handle Redis errors gracefully', async () => {
      // Arrange
      const inviteId = 'invite-123';
      mockRedisService.client = {
        incr: jest.fn().mockRejectedValue(new Error('Redis error')),
      } as any;

      // Act & Assert
      await expect(inviteHandler.handleInviteClick(mockSocket, inviteId)).rejects.toThrow(SocketError);
      await expect(inviteHandler.handleInviteClick(mockSocket, inviteId)).rejects.toHaveProperty(
        'code',
        SocketErrorCode.INTERNAL_ERROR
      );
    });
  });

  describe('handleInviteAnalyticsRequest', () => {
    it('should successfully handle an invite analytics request', async () => {
      // Arrange
      const inviteId = 'invite-123';
      const mockClickCount = '10';
      const mockDailyClicks = { '2023-09-01': '5', '2023-09-02': '5' };
      mockRedisService.client = {
        get: jest.fn().mockResolvedValue(mockClickCount),
        hgetall: jest.fn().mockResolvedValue(mockDailyClicks),
      } as any;

      // Act
      await inviteHandler.handleInviteAnalyticsRequest(mockSocket, inviteId);

      // Assert
      expect(mockRedisService.client.get).toHaveBeenCalledWith(`invite:${inviteId}:clicks`);
      expect(mockRedisService.client.hgetall).toHaveBeenCalledWith(`invite:${inviteId}:daily_clicks`);
      expect(mockSocket.emit).toHaveBeenCalledWith('inviteAnalytics', {
        id: inviteId,
        clickCount: 10,
        dailyClickData: { '2023-09-01': 5, '2023-09-02': 5 },
      } as Partial<IInvite>);
    });

    it('should handle missing analytics data', async () => {
      // Arrange
      const inviteId = 'invite-123';
      mockRedisService.client = {
        get: jest.fn().mockResolvedValue(null),
        hgetall: jest.fn().mockResolvedValue(null),
      } as any;

      // Act
      await inviteHandler.handleInviteAnalyticsRequest(mockSocket, inviteId);

      // Assert
      expect(mockSocket.emit).toHaveBeenCalledWith('inviteAnalytics', {
        id: inviteId,
        clickCount: 0,
        dailyClickData: {},
      } as Partial<IInvite>);
    });

    it('should throw an error for invalid invite ID', async () => {
      // Arrange
      const invalidInviteId = '';

      // Act & Assert
      await expect(inviteHandler.handleInviteAnalyticsRequest(mockSocket, invalidInviteId)).rejects.toThrow(SocketError);
      await expect(inviteHandler.handleInviteAnalyticsRequest(mockSocket, invalidInviteId)).rejects.toHaveProperty(
        'code',
        SocketErrorCode.INVALID_INPUT
      );
    });

    it('should handle Redis errors gracefully', async () => {
      // Arrange
      const inviteId = 'invite-123';
      mockRedisService.client = {
        get: jest.fn().mockRejectedValue(new Error('Redis error')),
      } as any;

      // Act & Assert
      await expect(inviteHandler.handleInviteAnalyticsRequest(mockSocket, inviteId)).rejects.toThrow(SocketError);
      await expect(inviteHandler.handleInviteAnalyticsRequest(mockSocket, inviteId)).rejects.toHaveProperty(
        'code',
        SocketErrorCode.INTERNAL_ERROR
      );
    });
  });
});