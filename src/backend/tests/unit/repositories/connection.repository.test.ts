import { ConnectionRepository } from '../../../src/repositories/connection.repository';
import { Connection, IConnectionDocument } from '../../../src/models/connection.model';
import { IConnection, IConnectionCreate, ConnectionStatus } from '@shared/interfaces/connection.interface';
import { Types } from 'mongoose';
import { ObjectId } from 'mongodb';

// Mock the Connection model
jest.mock('../../../src/models/connection.model');

describe('ConnectionRepository', () => {
  let connectionRepository: ConnectionRepository;
  let mockConnection: Partial<IConnectionDocument>;

  beforeEach(() => {
    connectionRepository = new ConnectionRepository();
    mockConnection = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId().toHexString(),
      connectedUserId: new Types.ObjectId().toHexString(),
      status: ConnectionStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
      networkValue: 3.14,
      toObject: jest.fn().mockReturnThis(),
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('#create', () => {
    it('should create a new connection successfully', async () => {
      const createData: IConnectionCreate = {
        userId: mockConnection.userId!,
        connectedUserId: mockConnection.connectedUserId!,
        status: ConnectionStatus.PENDING,
      };

      (Connection.prototype.save as jest.Mock).mockResolvedValue(mockConnection);

      const result = await connectionRepository.create(createData);

      expect(Connection).toHaveBeenCalledWith(createData);
      expect(result).toEqual(mockConnection);
    });

    it('should throw error when creation fails', async () => {
      const createData: IConnectionCreate = {
        userId: mockConnection.userId!,
        connectedUserId: mockConnection.connectedUserId!,
        status: ConnectionStatus.PENDING,
      };

      (Connection.prototype.save as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(connectionRepository.create(createData)).rejects.toThrow('Database error');
    });

    it('should validate input data before creation', async () => {
      const invalidData: any = {
        userId: 'invalid-id',
        connectedUserId: mockConnection.connectedUserId!,
        status: 'INVALID_STATUS',
      };

      await expect(connectionRepository.create(invalidData)).rejects.toThrow();
    });
  });

  describe('#findById', () => {
    it('should find connection by ID successfully', async () => {
      (Connection.findById as jest.Mock).mockResolvedValue(mockConnection);

      const result = await connectionRepository.findById(mockConnection._id!.toHexString());

      expect(Connection.findById).toHaveBeenCalledWith(mockConnection._id!.toHexString());
      expect(result).toEqual(mockConnection);
    });

    it('should return null when connection not found', async () => {
      (Connection.findById as jest.Mock).mockResolvedValue(null);

      const result = await connectionRepository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle invalid ID format', async () => {
      await expect(connectionRepository.findById('invalid-id')).rejects.toThrow();
    });
  });

  describe('#findByUsers', () => {
    it('should find connection between two users', async () => {
      (Connection.findOne as jest.Mock).mockResolvedValue(mockConnection);

      const result = await connectionRepository.findByUsers(mockConnection.userId!, mockConnection.connectedUserId!);

      expect(Connection.findOne).toHaveBeenCalledWith({
        $or: [
          { userId: mockConnection.userId, connectedUserId: mockConnection.connectedUserId },
          { userId: mockConnection.connectedUserId, connectedUserId: mockConnection.userId }
        ]
      });
      expect(result).toEqual(mockConnection);
    });

    it('should return null when no connection exists', async () => {
      (Connection.findOne as jest.Mock).mockResolvedValue(null);

      const result = await connectionRepository.findByUsers('user1', 'user2');

      expect(result).toBeNull();
    });
  });

  describe('#findByUser', () => {
    it('should find all connections for a user', async () => {
      const mockConnections = [mockConnection, { ...mockConnection, _id: new Types.ObjectId() }];
      (Connection.find as jest.Mock).mockReturnValue({
        byStatus: jest.fn().mockReturnThis(),
        byIndustry: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockConnections),
      });

      const result = await connectionRepository.findByUser(mockConnection.userId!, {});

      expect(Connection.find).toHaveBeenCalledWith({
        $or: [{ userId: mockConnection.userId }, { connectedUserId: mockConnection.userId }]
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockConnection);
    });

    it('should handle pagination options', async () => {
      const mockExec = jest.fn().mockResolvedValue([mockConnection]);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      (Connection.find as jest.Mock).mockReturnValue({
        skip: mockSkip,
      });

      await connectionRepository.findByUser(mockConnection.userId!, { limit: 10, offset: 20 });

      expect(mockSkip).toHaveBeenCalledWith(20);
      expect(mockLimit).toHaveBeenCalledWith(10);
    });

    it('should filter by connection status', async () => {
      const mockExec = jest.fn().mockResolvedValue([mockConnection]);
      const mockByStatus = jest.fn().mockReturnValue({ exec: mockExec });
      (Connection.find as jest.Mock).mockReturnValue({
        byStatus: mockByStatus,
      });

      await connectionRepository.findByUser(mockConnection.userId!, { status: ConnectionStatus.ACCEPTED });

      expect(mockByStatus).toHaveBeenCalledWith(ConnectionStatus.ACCEPTED);
    });

    it('should filter by industry', async () => {
      const mockExec = jest.fn().mockResolvedValue([mockConnection]);
      const mockByIndustry = jest.fn().mockReturnValue({ exec: mockExec });
      (Connection.find as jest.Mock).mockReturnValue({
        byIndustry: mockByIndustry,
      });

      await connectionRepository.findByUser(mockConnection.userId!, { industry: 'Technology' });

      expect(mockByIndustry).toHaveBeenCalledWith('Technology');
    });
  });

  describe('#updateStatus', () => {
    it('should update connection status successfully', async () => {
      const updatedConnection = { ...mockConnection, status: ConnectionStatus.ACCEPTED };
      (Connection.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedConnection);

      const result = await connectionRepository.updateStatus(mockConnection._id!.toHexString(), ConnectionStatus.ACCEPTED);

      expect(Connection.findByIdAndUpdate).toHaveBeenCalledWith(
        mockConnection._id!.toHexString(),
        { status: ConnectionStatus.ACCEPTED },
        { new: true, runValidators: true }
      );
      expect(result).toEqual(updatedConnection);
    });

    it('should throw error when connection not found', async () => {
      (Connection.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      await expect(connectionRepository.updateStatus('non-existent-id', ConnectionStatus.ACCEPTED)).rejects.toThrow('Connection not found');
    });

    it('should validate status transitions', async () => {
      // This test would depend on how you've implemented status transition validation
      // For example, if you don't allow transitioning from REJECTED to ACCEPTED:
      mockConnection.status = ConnectionStatus.REJECTED;
      (Connection.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockConnection);

      await expect(connectionRepository.updateStatus(mockConnection._id!.toHexString(), ConnectionStatus.ACCEPTED)).rejects.toThrow();
    });
  });

  describe('#delete', () => {
    it('should delete connection successfully', async () => {
      (Connection.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await connectionRepository.delete(mockConnection._id!.toHexString());

      expect(Connection.deleteOne).toHaveBeenCalledWith({ _id: new ObjectId(mockConnection._id!.toHexString()) });
      expect(result).toBe(true);
    });

    it('should return false when connection not found', async () => {
      (Connection.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      const result = await connectionRepository.delete('non-existent-id');

      expect(result).toBe(false);
    });

    it('should handle cascading updates', async () => {
      // This test would depend on how you've implemented cascading deletes
      // For example, if deleting a connection should update user's connection count:
      (Connection.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });
      // Mock any additional repository methods that should be called for cascading updates

      await connectionRepository.delete(mockConnection._id!.toHexString());

      // Assert that the necessary cascading update methods were called
    });
  });

  // Additional tests for calculateNetworkValue, findBySharedIndustry, and countConnections methods
  // can be implemented following similar patterns as above.
});