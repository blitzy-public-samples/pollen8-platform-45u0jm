import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { NetworkService } from '../services/network.service';
import { IConnection, IConnectionCreate } from '@shared/interfaces/connection.interface';
import { NetworkGraphData, INetworkStats } from '@shared/types/network.types';
import { formatResponse } from '../utils/responseFormatter';

/**
 * NetworkController class handling all network-related HTTP endpoints
 * @description Controller handling all network-related HTTP endpoints in the Pollen8 platform, managing user connections, network values, and industry-specific networking features.
 * @requirements_addressed 
 * - Verified Connections (Technical Specification/1.1 System Objectives)
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives)
 * - Industry Focus (Technical Specification/1.1 System Objectives)
 * - Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
@injectable()
export class NetworkController {
  constructor(
    @inject(NetworkService) private networkService: NetworkService
  ) {}

  /**
   * Creates a new connection between two users.
   * @param req Request - Express request object
   * @param res Response - Express response object
   * @returns Promise<Response> - Express response with created connection
   * @requirements_addressed Verified Connections (Technical Specification/1.1 System Objectives)
   */
  async createConnection(req: Request, res: Response): Promise<Response> {
    try {
      const connectionData: IConnectionCreate = {
        userId: new ObjectId(req.body.userId),
        connectedUserId: new ObjectId(req.body.connectedUserId)
      };

      const createdConnection: IConnection = await this.networkService.createConnection(connectionData);

      return formatResponse(res, 201, 'Connection created successfully', createdConnection);
    } catch (error) {
      return formatResponse(res, 400, 'Failed to create connection', null, error.message);
    }
  }

  /**
   * Retrieves the total network value for a user.
   * @param req Request - Express request object
   * @param res Response - Express response object
   * @returns Promise<Response> - Express response with network value
   * @requirements_addressed Quantifiable Networking (Technical Specification/1.1 System Objectives)
   */
  async getNetworkValue(req: Request, res: Response): Promise<Response> {
    try {
      const userId = new ObjectId(req.params.userId);
      const networkValue: number = await this.networkService.getNetworkValue(userId);

      return formatResponse(res, 200, 'Network value retrieved successfully', { networkValue });
    } catch (error) {
      return formatResponse(res, 400, 'Failed to retrieve network value', null, error.message);
    }
  }

  /**
   * Retrieves network statistics for a specific industry.
   * @param req Request - Express request object
   * @param res Response - Express response object
   * @returns Promise<Response> - Express response with industry network stats
   * @requirements_addressed Industry Focus (Technical Specification/1.1 System Objectives)
   */
  async getNetworkByIndustry(req: Request, res: Response): Promise<Response> {
    try {
      const userId = new ObjectId(req.params.userId);
      const industryId = req.params.industryId;
      const networkStats: INetworkStats = await this.networkService.getNetworkByIndustry(userId, industryId);

      return formatResponse(res, 200, 'Industry network statistics retrieved successfully', networkStats);
    } catch (error) {
      return formatResponse(res, 400, 'Failed to retrieve industry network statistics', null, error.message);
    }
  }

  /**
   * Returns data formatted for D3.js network visualization.
   * @param req Request - Express request object
   * @param res Response - Express response object
   * @returns Promise<Response> - Express response with D3.js graph data
   * @requirements_addressed Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
   */
  async getNetworkGraphData(req: Request, res: Response): Promise<Response> {
    try {
      const userId = new ObjectId(req.params.userId);
      const graphData: NetworkGraphData = await this.networkService.getNetworkGraphData(userId);

      return formatResponse(res, 200, 'Network graph data retrieved successfully', graphData);
    } catch (error) {
      return formatResponse(res, 400, 'Failed to retrieve network graph data', null, error.message);
    }
  }

  /**
   * Updates the status of an existing connection.
   * @param req Request - Express request object
   * @param res Response - Express response object
   * @returns Promise<Response> - Express response with updated connection
   * @requirements_addressed Verified Connections (Technical Specification/1.1 System Objectives)
   */
  async updateConnectionStatus(req: Request, res: Response): Promise<Response> {
    try {
      const connectionId = new ObjectId(req.params.connectionId);
      const { status } = req.body;
      const updatedConnection: IConnection = await this.networkService.updateConnectionStatus(connectionId, status);

      return formatResponse(res, 200, 'Connection status updated successfully', updatedConnection);
    } catch (error) {
      return formatResponse(res, 400, 'Failed to update connection status', null, error.message);
    }
  }
}

/**
 * @fileoverview This controller module handles all network-related HTTP endpoints in the Pollen8 platform.
 * It manages user connections, network values, and industry-specific networking features.
 * 
 * Key requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives)
 *    - Implemented in createConnection and updateConnectionStatus methods
 * 2. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Implemented in getNetworkValue method
 * 3. Industry Focus (Technical Specification/1.1 System Objectives)
 *    - Implemented in getNetworkByIndustry method
 * 4. Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 *    - Implemented in getNetworkGraphData method
 * 
 * This controller relies on the NetworkService for business logic implementation and uses
 * the formatResponse utility for consistent API responses.
 */