import { NetworkValueHandler } from '../../../src/handlers/networkValueHandler';
import { RedisService } from '../../../src/services/redisService';
import EventEmitter from '../../../src/services/eventEmitter';
import { ISocketUser, NetworkValuePayload } from '../../../src/types/socket.types';
import { BASE_CONNECTION_VALUE } from '../../../../shared/constants/networkValue';
import { SocketError, SocketErrorCode } from '../../../src/utils/errorHandler';

// Mock dependencies
jest.mock('../../../src/services/redisService');
jest.mock('../../../src/services/eventEmitter');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/metrics');

describe('NetworkValueHandler', () => {
  let networkValueHandler: NetworkValueHandler;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockEventEmitter: jest.Mocked<EventEmitter>;
  let mockSocket: ISocketUser;

  beforeEach(() => {
    mockRedisService = {
      getSocketData: jest.fn(),
      setSocketData: jest.fn(),
      publishEvent: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    mockEventEmitter = {
      emitNetworkValueChange: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter>;

    mockSocket = {
      userId: 'testUser123',
      industries: ['Technology', 'Finance'],
    } as ISocketUser;

    networkValueHandler = new NetworkValueHandler(mockRedisService, mockEventEmitter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleNetworkValueUpdate', () => {
    it('calculates and broadcasts network value update correctly', async () => {
      // Arrange
      const userId = 'testUser123';
      const industries = ['Technology', 'Finance'];
      const connectionCount = 5;
      const oldValue = 12.56; // 4 connections
      const expectedNewValue = 15.7; // 5 connections * 3.14

      mockRedisService.getSocketData
        .mockResolvedValueOnce(connectionCount.toString())
        .mockResolvedValueOnce(oldValue.toString());

      // Act
      await networkValueHandler.handleNetworkValueUpdate(mockSocket, userId, industries);

      // Assert
      expect(mockRedisService.getSocketData).toHaveBeenCalledWith(`connectionCount:${userId}`);
      expect(mockRedisService.getSocketData).toHaveBeenCalledWith(`networkValue:${userId}`);
      expect(mockRedisService.setSocketData).toHaveBeenCalledWith(`networkValue:${userId}`, expectedNewValue.toString());
      expect(mockEventEmitter.emitNetworkValueChange).toHaveBeenCalledWith({
        userId,
        newValue: expectedNewValue,
        change: expectedNewValue - oldValue,
      });
      expect(mockRedisService.publishEvent).toHaveBeenCalledTimes(2); // Once for each industry
    });

    it('handles Redis errors gracefully', async () => {
      // Arrange
      const userId = 'testUser123';
      const industries = ['Technology', 'Finance'];
      mockRedisService.getSocketData.mockRejectedValue(new Error('Redis error'));

      // Act & Assert
      await expect(networkValueHandler.handleNetworkValueUpdate(mockSocket, userId, industries))
        .rejects.toThrow(SocketError);
      expect(mockRedisService.getSocketData).toHaveBeenCalledWith(`connectionCount:${userId}`);
    });
  });

  describe('calculateNetworkValue', () => {
    it('returns correct values for different connection counts', () => {
      // Arrange
      const testCases = [
        { connections: 0, expected: 0 },
        { connections: 1, expected: 3.14 },
        { connections: 5, expected: 15.7 },
        { connections: 10, expected: 31.4 },
      ];

      // Act & Assert
      testCases.forEach(({ connections, expected }) => {
        // @ts-ignore - Accessing private method for testing
        const result = networkValueHandler.calculateNetworkValue(connections);
        expect(result).toBe(expected);
      });
    });
  });

  describe('broadcastValueChange', () => {
    it('sends updates to correct industries', async () => {
      // Arrange
      const userId = 'testUser123';
      const newValue = 15.7;
      const oldValue = 12.56;
      const industries = ['Technology', 'Finance'];
      const expectedPayload: NetworkValuePayload = {
        userId,
        newValue,
        change: newValue - oldValue,
      };

      // Act
      // @ts-ignore - Accessing private method for testing
      await networkValueHandler.broadcastValueChange(userId, newValue, oldValue, industries);

      // Assert
      expect(mockEventEmitter.emitNetworkValueChange).toHaveBeenCalledWith(expectedPayload);
      expect(mockRedisService.publishEvent).toHaveBeenCalledTimes(2);
      expect(mockRedisService.publishEvent).toHaveBeenCalledWith('industry:Technology', 'networkValueChange', expectedPayload);
      expect(mockRedisService.publishEvent).toHaveBeenCalledWith('industry:Finance', 'networkValueChange', expectedPayload);
    });
  });
});