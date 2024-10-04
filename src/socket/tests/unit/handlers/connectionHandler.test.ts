import { ConnectionHandler } from '../../../src/handlers/connectionHandler';
import { ISocketUser, NetworkUpdatePayload } from '../../../src/types/socket.types';
import { RedisService } from '../../../src/services/redisService';
import EventEmitter from '../../../src/services/eventEmitter';
import { IConnection } from '../../../../shared/interfaces/connection.interface';
import { Socket } from 'socket.io';
import { createSocketError, SocketErrorCode } from '../../../src/utils/errorHandler';

// Mock dependencies
jest.mock('../../../src/services/redisService');
jest.mock('../../../src/services/eventEmitter');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/metrics');

describe('ConnectionHandler', () => {
  let connectionHandler: ConnectionHandler;
  let mockSocket: ISocketUser;
  let mockRedisService: jest.Mocked<RedisService>;
  let mockEventEmitter: jest.Mocked<EventEmitter>;

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();

    // Create mock instances
    mockRedisService = {
      getInstance: jest.fn().mockReturnThis(),
      getSocketData: jest.fn(),
      setSocketData: jest.fn(),
    } as unknown as jest.Mocked<RedisService>;

    mockEventEmitter = {
      emitNetworkUpdate: jest.fn(),
      emitNetworkValueChange: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter>;

    // Create a mock socket
    mockSocket = {
      id: 'mockSocketId',
      userId: 'mockUserId',
      industries: ['Technology'],
      on: jest.fn(),
      emit: jest.fn(),
    } as unknown as ISocketUser;

    // Initialize ConnectionHandler
    connectionHandler = ConnectionHandler.getInstance(mockEventEmitter);
    (connectionHandler as any).redisService = mockRedisService;
  });

  describe('handleConnection', () => {
    it('should set up event listeners for the socket', () => {
      connectionHandler.handleConnection(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledTimes(3);
      expect(mockSocket.on).toHaveBeenCalledWith('connectionRequest', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connectionAccept', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connectionReject', expect.any(Function));
    });
  });

  describe('handleConnectionRequest', () => {
    it('should handle a valid connection request', async () => {
      const targetUserId = 'targetUserId';
      mockRedisService.getSocketData.mockResolvedValue(null);

      await (connectionHandler as any).handleConnectionRequest(mockSocket, targetUserId);

      expect(mockRedisService.setSocketData).toHaveBeenCalledWith(
        expect.stringContaining('connection:'),
        expect.objectContaining({
          id: `${mockSocket.userId}:${targetUserId}`,
          requesterId: mockSocket.userId,
          targetId: targetUserId,
          status: 'pending',
        }),
        86400
      );

      expect(mockEventEmitter.emitNetworkUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          nodes: [{ id: mockSocket.userId, type: 'user' }],
          links: [{ source: mockSocket.userId, target: targetUserId, type: 'pending' }],
          industry: 'Technology',
        })
      );
    });

    it('should throw an error for an invalid target user ID', async () => {
      await expect((connectionHandler as any).handleConnectionRequest(mockSocket, '')).rejects.toThrow('Invalid target user ID');
      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid target user ID' });
    });

    it('should throw an error for an existing connection', async () => {
      mockRedisService.getSocketData.mockResolvedValue({} as IConnection);
      await (connectionHandler as any).handleConnectionRequest(mockSocket, 'existingUserId');
      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Connection already exists' });
    });
  });

  describe('handleConnectionAccept', () => {
    const mockConnection: IConnection = {
      id: 'mockConnectionId',
      requesterId: 'requesterId',
      targetId: 'mockUserId',
      status: 'pending',
      createdAt: new Date(),
    };

    it('should handle a valid connection acceptance', async () => {
      mockRedisService.getSocketData.mockResolvedValue(mockConnection);

      await (connectionHandler as any).handleConnectionAccept(mockSocket, 'mockConnectionId');

      expect(mockRedisService.setSocketData).toHaveBeenCalledWith(
        'connection:mockConnectionId',
        expect.objectContaining({
          status: 'accepted',
          acceptedAt: expect.any(Date),
        })
      );

      expect(mockEventEmitter.emitNetworkUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          nodes: [
            { id: mockConnection.requesterId, type: 'user' },
            { id: mockConnection.targetId, type: 'user' },
          ],
          links: [{ source: mockConnection.requesterId, target: mockConnection.targetId, type: 'accepted' }],
          industry: 'Technology',
        })
      );
    });

    it('should throw an error for an invalid connection ID', async () => {
      await expect((connectionHandler as any).handleConnectionAccept(mockSocket, '')).rejects.toThrow('Invalid connection ID');
      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid connection ID' });
    });

    it('should throw an error for an invalid connection or unauthorized action', async () => {
      mockRedisService.getSocketData.mockResolvedValue(null);
      await (connectionHandler as any).handleConnectionAccept(mockSocket, 'invalidConnectionId');
      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid connection or unauthorized action' });
    });
  });

  describe('handleConnectionReject', () => {
    const mockConnection: IConnection = {
      id: 'mockConnectionId',
      requesterId: 'requesterId',
      targetId: 'mockUserId',
      status: 'pending',
      createdAt: new Date(),
    };

    it('should handle a valid connection rejection', async () => {
      mockRedisService.getSocketData.mockResolvedValue(mockConnection);

      await (connectionHandler as any).handleConnectionReject(mockSocket, 'mockConnectionId');

      expect(mockRedisService.setSocketData).toHaveBeenCalledWith(
        'connection:mockConnectionId',
        expect.objectContaining({
          status: 'rejected',
          rejectedAt: expect.any(Date),
        }),
        86400
      );

      expect(mockEventEmitter.emitNetworkUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          nodes: [
            { id: mockConnection.requesterId, type: 'user' },
            { id: mockConnection.targetId, type: 'user' },
          ],
          links: [],
          industry: 'Technology',
        })
      );
    });

    it('should throw an error for an invalid connection ID', async () => {
      await expect((connectionHandler as any).handleConnectionReject(mockSocket, '')).rejects.toThrow('Invalid connection ID');
      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid connection ID' });
    });

    it('should throw an error for an invalid connection or unauthorized action', async () => {
      mockRedisService.getSocketData.mockResolvedValue(null);
      await (connectionHandler as any).handleConnectionReject(mockSocket, 'invalidConnectionId');
      expect(mockSocket.emit).toHaveBeenCalledWith('error', { message: 'Invalid connection or unauthorized action' });
    });
  });

  describe('updateNetworkValue', () => {
    it('should update network value correctly', async () => {
      mockRedisService.getSocketData.mockResolvedValue(10);
      await (connectionHandler as any).updateNetworkValue('mockUserId', 3.14);

      expect(mockRedisService.setSocketData).toHaveBeenCalledWith('networkValue:mockUserId', 13.14);
      expect(mockEventEmitter.emitNetworkValueChange).toHaveBeenCalledWith({
        userId: 'mockUserId',
        newValue: 13.14,
        change: 3.14,
      });
    });

    it('should handle initial network value', async () => {
      mockRedisService.getSocketData.mockResolvedValue(null);
      await (connectionHandler as any).updateNetworkValue('mockUserId', 3.14);

      expect(mockRedisService.setSocketData).toHaveBeenCalledWith('networkValue:mockUserId', 3.14);
      expect(mockEventEmitter.emitNetworkValueChange).toHaveBeenCalledWith({
        userId: 'mockUserId',
        newValue: 3.14,
        change: 3.14,
      });
    });

    it('should throw an error if update fails', async () => {
      mockRedisService.getSocketData.mockRejectedValue(new Error('Redis error'));
      await expect((connectionHandler as any).updateNetworkValue('mockUserId', 3.14)).rejects.toThrow('Failed to update network value');
    });
  });
});