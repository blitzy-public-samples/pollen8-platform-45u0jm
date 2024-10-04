import { MockProxy, mock } from 'jest-mock-extended';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { NetworkController } from '../../../src/controllers/network.controller';
import { NetworkService } from '../../../src/services/network.service';
import { IConnection, IConnectionCreate } from '@shared/interfaces/connection.interface';
import { NetworkGraphData, INetworkStats } from '@shared/types/network.types';

describe('NetworkController', () => {
  let mockNetworkService: MockProxy<NetworkService>;
  let networkController: NetworkController;
  let mockRequest: MockProxy<Request>;
  let mockResponse: MockProxy<Response>;

  beforeEach(() => {
    mockNetworkService = mock<NetworkService>();
    networkController = new NetworkController(mockNetworkService);
    mockRequest = mock<Request>();
    mockResponse = mock<Response>();
    mockResponse.status.mockReturnThis();
    mockResponse.json.mockReturnThis();
  });

  describe('createConnection', () => {
    it('should create a connection successfully', async () => {
      const connectionData: IConnectionCreate = {
        userId: new ObjectId(),
        connectedUserId: new ObjectId()
      };
      const createdConnection: IConnection = {
        _id: new ObjectId(),
        ...connectionData,
        connectedAt: new Date(),
        sharedIndustries: []
      };

      mockRequest.body = connectionData;
      mockNetworkService.createConnection.mockResolvedValue(createdConnection);

      await networkController.createConnection(mockRequest, mockResponse);

      expect(mockNetworkService.createConnection).toHaveBeenCalledWith(connectionData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Connection created successfully',
        data: createdConnection
      }));
    });

    it('should handle errors when creating a connection', async () => {
      const errorMessage = 'Failed to create connection';
      mockRequest.body = { userId: 'invalid', connectedUserId: 'invalid' };
      mockNetworkService.createConnection.mockRejectedValue(new Error(errorMessage));

      await networkController.createConnection(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Failed to create connection',
        error: errorMessage
      }));
    });
  });

  describe('getNetworkValue', () => {
    it('should retrieve network value successfully', async () => {
      const userId = new ObjectId();
      const networkValue = 15.7;

      mockRequest.params = { userId: userId.toHexString() };
      mockNetworkService.getNetworkValue.mockResolvedValue(networkValue);

      await networkController.getNetworkValue(mockRequest, mockResponse);

      expect(mockNetworkService.getNetworkValue).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Network value retrieved successfully',
        data: { networkValue }
      }));
    });

    it('should handle errors when retrieving network value', async () => {
      const errorMessage = 'User not found';
      mockRequest.params = { userId: 'invalid' };
      mockNetworkService.getNetworkValue.mockRejectedValue(new Error(errorMessage));

      await networkController.getNetworkValue(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Failed to retrieve network value',
        error: errorMessage
      }));
    });
  });

  describe('getNetworkByIndustry', () => {
    it('should retrieve industry-specific network stats successfully', async () => {
      const userId = new ObjectId();
      const industryId = 'tech123';
      const networkStats: INetworkStats = {
        connectionCount: 5,
        averageNetworkValue: 12.5,
        topConnections: []
      };

      mockRequest.params = { userId: userId.toHexString(), industryId };
      mockNetworkService.getNetworkByIndustry.mockResolvedValue(networkStats);

      await networkController.getNetworkByIndustry(mockRequest, mockResponse);

      expect(mockNetworkService.getNetworkByIndustry).toHaveBeenCalledWith(userId, industryId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Industry network statistics retrieved successfully',
        data: networkStats
      }));
    });

    it('should handle errors when retrieving industry network stats', async () => {
      const errorMessage = 'Invalid industry ID';
      mockRequest.params = { userId: new ObjectId().toHexString(), industryId: 'invalid' };
      mockNetworkService.getNetworkByIndustry.mockRejectedValue(new Error(errorMessage));

      await networkController.getNetworkByIndustry(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Failed to retrieve industry network statistics',
        error: errorMessage
      }));
    });
  });

  describe('getNetworkGraphData', () => {
    it('should retrieve network graph data successfully', async () => {
      const userId = new ObjectId();
      const graphData: NetworkGraphData = {
        nodes: [{ id: '1', name: 'User 1' }],
        links: [{ source: '1', target: '2' }]
      };

      mockRequest.params = { userId: userId.toHexString() };
      mockNetworkService.getNetworkGraphData.mockResolvedValue(graphData);

      await networkController.getNetworkGraphData(mockRequest, mockResponse);

      expect(mockNetworkService.getNetworkGraphData).toHaveBeenCalledWith(userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Network graph data retrieved successfully',
        data: graphData
      }));
    });

    it('should handle errors when retrieving network graph data', async () => {
      const errorMessage = 'Failed to generate graph data';
      mockRequest.params = { userId: 'invalid' };
      mockNetworkService.getNetworkGraphData.mockRejectedValue(new Error(errorMessage));

      await networkController.getNetworkGraphData(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Failed to retrieve network graph data',
        error: errorMessage
      }));
    });
  });

  describe('updateConnectionStatus', () => {
    it('should update connection status successfully', async () => {
      const connectionId = new ObjectId();
      const status = 'accepted';
      const updatedConnection: IConnection = {
        _id: connectionId,
        userId: new ObjectId(),
        connectedUserId: new ObjectId(),
        connectedAt: new Date(),
        sharedIndustries: [],
        status
      };

      mockRequest.params = { connectionId: connectionId.toHexString() };
      mockRequest.body = { status };
      mockNetworkService.updateConnectionStatus.mockResolvedValue(updatedConnection);

      await networkController.updateConnectionStatus(mockRequest, mockResponse);

      expect(mockNetworkService.updateConnectionStatus).toHaveBeenCalledWith(connectionId, status);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Connection status updated successfully',
        data: updatedConnection
      }));
    });

    it('should handle errors when updating connection status', async () => {
      const errorMessage = 'Invalid status transition';
      mockRequest.params = { connectionId: new ObjectId().toHexString() };
      mockRequest.body = { status: 'invalid' };
      mockNetworkService.updateConnectionStatus.mockRejectedValue(new Error(errorMessage));

      await networkController.updateConnectionStatus(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Failed to update connection status',
        error: errorMessage
      }));
    });
  });
});