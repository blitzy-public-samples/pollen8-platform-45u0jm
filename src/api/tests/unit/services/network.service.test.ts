import { ObjectId } from 'mongodb';
import { NetworkService } from '@api/services/network.service';
import { ConnectionRepository } from '@database/repositories/connection.repository';
import { UserRepository } from '@database/repositories/user.repository';
import { IndustryRepository } from '@database/repositories/industry.repository';
import { CacheService } from '@services/cache.service';
import { EventEmitter } from '@services/eventEmitter';
import { Logger } from '@utils/logger';
import { IConnection, IConnectionCreate, ConnectionStatus } from '@shared/interfaces/connection.interface';
import { NetworkGraphData, INetworkStats, NETWORK_VALUE_PER_CONNECTION } from '@shared/types/network.types';
import { calculateNetworkValue, generateNetworkGraphData } from '@shared/utils/networkCalculation';

// Mock dependencies
jest.mock('@database/repositories/connection.repository');
jest.mock('@database/repositories/user.repository');
jest.mock('@database/repositories/industry.repository');
jest.mock('@services/cache.service');
jest.mock('@services/eventEmitter');
jest.mock('@utils/logger');
jest.mock('@shared/utils/networkCalculation');

describe('NetworkService', () => {
  let networkService: NetworkService;
  let connectionRepositoryMock: jest.Mocked<ConnectionRepository>;
  let userRepositoryMock: jest.Mocked<UserRepository>;
  let industryRepositoryMock: jest.Mocked<IndustryRepository>;
  let cacheServiceMock: jest.Mocked<CacheService>;
  let eventEmitterMock: jest.Mocked<EventEmitter>;
  let loggerMock: jest.Mocked<Logger>;

  beforeEach(() => {
    connectionRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    } as any;
    userRepositoryMock = {
      findMany: jest.fn(),
      update: jest.fn(),
    } as any;
    industryRepositoryMock = {} as any;
    cacheServiceMock = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;
    eventEmitterMock = {
      emit: jest.fn(),
    } as any;
    loggerMock = {
      info: jest.fn(),
    } as any;

    networkService = new NetworkService(
      connectionRepositoryMock,
      userRepositoryMock,
      industryRepositoryMock,
      cacheServiceMock,
      eventEmitterMock,
      loggerMock
    );
  });

  describe('createConnection', () => {
    it('should create a new connection successfully', async () => {
      // Arrange
      const connectionData: IConnectionCreate = {
        userId: new ObjectId(),
        connectedUserId: new ObjectId(),
      };
      const createdConnection: IConnection = {
        ...connectionData,
        _id: new ObjectId(),
        status: ConnectionStatus.PENDING,
        sharedIndustries: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      connectionRepositoryMock.findOne.mockResolvedValue(null);
      connectionRepositoryMock.create.mockResolvedValue(createdConnection);

      // Act
      const result = await networkService.createConnection(connectionData);

      // Assert
      expect(result).toEqual(createdConnection);
      expect(connectionRepositoryMock.findOne).toHaveBeenCalledWith({
        userId: connectionData.userId,
        connectedUserId: connectionData.connectedUserId,
      });
      expect(connectionRepositoryMock.create).toHaveBeenCalledWith(expect.objectContaining({
        ...connectionData,
        status: ConnectionStatus.PENDING,
      }));
      expect(eventEmitterMock.emit).toHaveBeenCalledTimes(2);
      expect(loggerMock.info).toHaveBeenCalledWith('Connection created successfully', expect.any(Object));
    });

    it('should throw ConnectionExistsError for duplicate connections', async () => {
      // Arrange
      const connectionData: IConnectionCreate = {
        userId: new ObjectId(),
        connectedUserId: new ObjectId(),
      };
      connectionRepositoryMock.findOne.mockResolvedValue({} as IConnection);

      // Act & Assert
      await expect(networkService.createConnection(connectionData)).rejects.toThrow('Connection already exists');
    });

    it('should calculate shared industries when creating connection', async () => {
      // This test would require mocking the industry calculation logic
      // Implementation depends on how shared industries are determined
    });
  });

  describe('getNetworkValue', () => {
    it('should calculate correct network value using 3.14 per connection', async () => {
      // Arrange
      const userId = new ObjectId();
      const connections = [{ _id: new ObjectId() }, { _id: new ObjectId() }] as IConnection[];
      connectionRepositoryMock.find.mockResolvedValue(connections);
      cacheServiceMock.get.mockResolvedValue(null);
      (calculateNetworkValue as jest.Mock).mockReturnValue(6.28); // 2 connections * 3.14

      // Act
      const result = await networkService.getNetworkValue(userId);

      // Assert
      expect(result).toBe(6.28);
      expect(connectionRepositoryMock.find).toHaveBeenCalledWith({ userId, status: ConnectionStatus.ACCEPTED });
      expect(calculateNetworkValue).toHaveBeenCalledWith(2, NETWORK_VALUE_PER_CONNECTION);
      expect(cacheServiceMock.set).toHaveBeenCalledWith(`networkValue:${userId.toHexString()}`, 6.28, 3600);
    });

    it('should return 0 for user with no connections', async () => {
      // Arrange
      const userId = new ObjectId();
      connectionRepositoryMock.find.mockResolvedValue([]);
      cacheServiceMock.get.mockResolvedValue(null);
      (calculateNetworkValue as jest.Mock).mockReturnValue(0);

      // Act
      const result = await networkService.getNetworkValue(userId);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle invalid user ID', async () => {
      // Arrange
      const invalidUserId = 'invalid-id';

      // Act & Assert
      await expect(networkService.getNetworkValue(invalidUserId as any)).rejects.toThrow();
    });
  });

  describe('getNetworkByIndustry', () => {
    it('should return correct statistics for specific industry', async () => {
      // Arrange
      const userId = new ObjectId();
      const industryId = 'industry1';
      const connections = [
        { sharedIndustries: [industryId] },
        { sharedIndustries: [industryId] },
        { sharedIndustries: ['otherIndustry'] },
      ] as IConnection[];
      connectionRepositoryMock.find.mockResolvedValue(connections);
      (calculateNetworkValue as jest.Mock).mockReturnValue(6.28); // 2 connections * 3.14

      // Act
      const result = await networkService.getNetworkByIndustry(userId, industryId);

      // Assert
      expect(result).toEqual({
        totalConnections: 2,
        byIndustry: { [industryId]: 2 },
        networkValue: 6.28,
        growthRate: 0,
      });
    });

    it('should return empty stats for industry with no connections', async () => {
      // Arrange
      const userId = new ObjectId();
      const industryId = 'emptyIndustry';
      connectionRepositoryMock.find.mockResolvedValue([]);
      (calculateNetworkValue as jest.Mock).mockReturnValue(0);

      // Act
      const result = await networkService.getNetworkByIndustry(userId, industryId);

      // Assert
      expect(result).toEqual({
        totalConnections: 0,
        byIndustry: { [industryId]: 0 },
        networkValue: 0,
        growthRate: 0,
      });
    });
  });

  describe('getNetworkGraphData', () => {
    it('should generate correct graph data structure for D3.js', async () => {
      // Arrange
      const userId = new ObjectId();
      const connections = [{ connectedUserId: new ObjectId() }] as IConnection[];
      const users = [{ _id: userId }, { _id: connections[0].connectedUserId }];
      connectionRepositoryMock.find.mockResolvedValue(connections);
      userRepositoryMock.findMany.mockResolvedValue(users);
      (generateNetworkGraphData as jest.Mock).mockReturnValue({ nodes: [], links: [] });
      (calculateNetworkValue as jest.Mock).mockReturnValue(3.14);

      // Act
      const result = await networkService.getNetworkGraphData(userId);

      // Assert
      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('links');
      expect(result).toHaveProperty('totalValue', 3.14);
      expect(generateNetworkGraphData).toHaveBeenCalledWith(userId, connections, users);
    });

    it('should handle empty network', async () => {
      // Arrange
      const userId = new ObjectId();
      connectionRepositoryMock.find.mockResolvedValue([]);
      userRepositoryMock.findMany.mockResolvedValue([{ _id: userId }]);
      (generateNetworkGraphData as jest.Mock).mockReturnValue({ nodes: [], links: [] });
      (calculateNetworkValue as jest.Mock).mockReturnValue(0);

      // Act
      const result = await networkService.getNetworkGraphData(userId);

      // Assert
      expect(result).toEqual({ nodes: [], links: [], totalValue: 0 });
    });
  });

  describe('updateConnectionStatus', () => {
    it('should update connection status successfully', async () => {
      // Arrange
      const connectionId = new ObjectId();
      const existingConnection: IConnection = {
        _id: connectionId,
        userId: new ObjectId(),
        connectedUserId: new ObjectId(),
        status: ConnectionStatus.PENDING,
        sharedIndustries: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const newStatus = ConnectionStatus.ACCEPTED;
      connectionRepositoryMock.findById.mockResolvedValue(existingConnection);
      connectionRepositoryMock.update.mockResolvedValue({ ...existingConnection, status: newStatus });

      // Act
      const result = await networkService.updateConnectionStatus(connectionId, newStatus);

      // Assert
      expect(result.status).toBe(newStatus);
      expect(connectionRepositoryMock.update).toHaveBeenCalledWith(connectionId, expect.objectContaining({ status: newStatus }));
      expect(eventEmitterMock.emit).toHaveBeenCalledWith('connectionUpdate', { connectionId, status: newStatus });
    });

    it('should throw InvalidConnectionError for invalid status transitions', async () => {
      // Arrange
      const connectionId = new ObjectId();
      const existingConnection: IConnection = {
        _id: connectionId,
        userId: new ObjectId(),
        connectedUserId: new ObjectId(),
        status: ConnectionStatus.ACCEPTED,
        sharedIndustries: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      connectionRepositoryMock.findById.mockResolvedValue(existingConnection);

      // Act & Assert
      await expect(networkService.updateConnectionStatus(connectionId, ConnectionStatus.PENDING)).rejects.toThrow('Invalid status transition');
    });
  });
});