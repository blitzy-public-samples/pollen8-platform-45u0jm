import { injectable, inject } from 'inversify';
import { ObjectId } from 'mongodb';
import { IConnection, IConnectionCreate, ConnectionStatus } from '@shared/interfaces/connection.interface';
import { NetworkGraphData, INetworkStats, NETWORK_VALUE_PER_CONNECTION } from '@shared/types/network.types';
import { ConnectionRepository } from '@database/repositories/connection.repository';
import { UserRepository } from '@database/repositories/user.repository';
import { IndustryRepository } from '@database/repositories/industry.repository';
import { CacheService } from '@services/cache.service';
import { EventEmitter } from '@services/eventEmitter';
import { calculateNetworkValue, generateNetworkGraphData } from '@shared/utils/networkCalculation';
import { Logger } from '@utils/logger';

/**
 * NetworkService class handling all network-related operations
 * @description This service implements core network functionality for the Pollen8 platform
 * @requirements Verified Connections, Quantifiable Networking, Industry Focus (Technical Specification/1.1 System Objectives)
 */
@injectable()
export class NetworkService {
  constructor(
    @inject(ConnectionRepository) private connectionRepository: ConnectionRepository,
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(IndustryRepository) private industryRepository: IndustryRepository,
    @inject(CacheService) private cacheService: CacheService,
    @inject(EventEmitter) private eventEmitter: EventEmitter,
    @inject(Logger) private logger: Logger
  ) {}

  /**
   * Creates a new connection between two users
   * @param data IConnectionCreate - Data for creating a new connection
   * @returns Promise<IConnection> - The created connection
   * @requirements Verified Connections (Technical Specification/1.1 System Objectives)
   */
  async createConnection(data: IConnectionCreate): Promise<IConnection> {
    this.logger.info('Creating new connection', { userId: data.userId, connectedUserId: data.connectedUserId });

    // Validate connection data
    if (data.userId.equals(data.connectedUserId)) {
      throw new Error('Users cannot connect to themselves');
    }

    // Check for existing connection
    const existingConnection = await this.connectionRepository.findOne({
      userId: data.userId,
      connectedUserId: data.connectedUserId
    });

    if (existingConnection) {
      throw new Error('Connection already exists');
    }

    // Create connection in repository
    const newConnection: IConnection = {
      ...data,
      status: ConnectionStatus.PENDING,
      sharedIndustries: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const createdConnection = await this.connectionRepository.create(newConnection);

    // Calculate new network value
    await this.updateNetworkValue(data.userId);
    await this.updateNetworkValue(data.connectedUserId);

    // Emit network update event
    this.eventEmitter.emit('networkUpdate', { userId: data.userId, type: 'newConnection' });
    this.eventEmitter.emit('networkUpdate', { userId: data.connectedUserId, type: 'newConnection' });

    this.logger.info('Connection created successfully', { connectionId: createdConnection._id });
    return createdConnection;
  }

  /**
   * Calculates and returns the total network value for a user
   * @param userId ObjectId - The ID of the user
   * @returns Promise<number> - The calculated network value
   * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives)
   */
  async getNetworkValue(userId: ObjectId): Promise<number> {
    const cacheKey = `networkValue:${userId.toHexString()}`;

    // Check cache for network value
    const cachedValue = await this.cacheService.get<number>(cacheKey);
    if (cachedValue !== null) {
      return cachedValue;
    }

    // If not cached, fetch user connections
    const connections = await this.connectionRepository.find({ userId, status: ConnectionStatus.ACCEPTED });

    // Calculate network value using NETWORK_VALUE_PER_CONNECTION
    const networkValue = calculateNetworkValue(connections.length, NETWORK_VALUE_PER_CONNECTION);

    // Cache the calculated value
    await this.cacheService.set(cacheKey, networkValue, 3600); // Cache for 1 hour

    this.logger.info('Network value calculated', { userId, networkValue });
    return networkValue;
  }

  /**
   * Retrieves network statistics for a specific industry
   * @param userId ObjectId - The ID of the user
   * @param industryId string - The ID of the industry
   * @returns Promise<INetworkStats> - Industry-specific network statistics
   * @requirements Industry Focus (Technical Specification/1.1 System Objectives)
   */
  async getNetworkByIndustry(userId: ObjectId, industryId: string): Promise<INetworkStats> {
    this.logger.info('Fetching network statistics by industry', { userId, industryId });

    // Fetch user's connections
    const connections = await this.connectionRepository.find({ userId, status: ConnectionStatus.ACCEPTED });

    // Filter connections by industry
    const industryConnections = connections.filter(conn => conn.sharedIndustries.includes(industryId));

    // Calculate industry-specific statistics
    const stats: INetworkStats = {
      totalConnections: industryConnections.length,
      byIndustry: { [industryId]: industryConnections.length },
      networkValue: calculateNetworkValue(industryConnections.length, NETWORK_VALUE_PER_CONNECTION),
      growthRate: 0 // This would require historical data to calculate accurately
    };

    this.logger.info('Network statistics by industry calculated', { userId, industryId, stats });
    return stats;
  }

  /**
   * Generates and returns data for D3.js network visualization
   * @param userId ObjectId - The ID of the user
   * @returns Promise<NetworkGraphData> - Data formatted for D3.js visualization
   * @requirements Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
   */
  async getNetworkGraphData(userId: ObjectId): Promise<NetworkGraphData> {
    this.logger.info('Generating network graph data', { userId });

    // Fetch user's connections
    const connections = await this.connectionRepository.find({ userId, status: ConnectionStatus.ACCEPTED });

    // Fetch connected users' data
    const connectedUserIds = connections.map(conn => conn.connectedUserId);
    const users = await this.userRepository.findMany([userId, ...connectedUserIds]);

    // Generate graph nodes and links
    const graphData = generateNetworkGraphData(userId, connections, users);

    // Calculate total network value
    const totalValue = await this.getNetworkValue(userId);
    graphData.totalValue = totalValue;

    this.logger.info('Network graph data generated', { userId, nodesCount: graphData.nodes.length, linksCount: graphData.links.length });
    return graphData;
  }

  /**
   * Updates the status of an existing connection
   * @param connectionId ObjectId - The ID of the connection to update
   * @param status ConnectionStatus - The new status of the connection
   * @returns Promise<IConnection> - The updated connection
   * @requirements Verified Connections (Technical Specification/1.1 System Objectives)
   */
  async updateConnectionStatus(connectionId: ObjectId, status: ConnectionStatus): Promise<IConnection> {
    this.logger.info('Updating connection status', { connectionId, status });

    // Validate status transition
    const connection = await this.connectionRepository.findById(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    if (connection.status === ConnectionStatus.ACCEPTED && status === ConnectionStatus.PENDING) {
      throw new Error('Invalid status transition');
    }

    // Update connection in repository
    const updatedConnection = await this.connectionRepository.update(connectionId, { status, updatedAt: new Date() });

    // Recalculate affected network values
    await this.updateNetworkValue(updatedConnection.userId);
    await this.updateNetworkValue(updatedConnection.connectedUserId);

    // Emit connection update event
    this.eventEmitter.emit('connectionUpdate', { connectionId, status });

    this.logger.info('Connection status updated successfully', { connectionId, status });
    return updatedConnection;
  }

  /**
   * Updates the network value for a user
   * @param userId ObjectId - The ID of the user
   * @private
   */
  private async updateNetworkValue(userId: ObjectId): Promise<void> {
    const newValue = await this.getNetworkValue(userId);
    await this.userRepository.update(userId, { networkValue: newValue });
    this.logger.info('User network value updated', { userId, newValue });
  }
}

/**
 * @fileoverview This service module handles all network-related business logic in the Pollen8 platform,
 * including connection management, network value calculations, and industry-specific networking features.
 * 
 * Key requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives)
 *    - Implemented in createConnection and updateConnectionStatus methods
 * 2. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Implemented in getNetworkValue and updateNetworkValue methods
 * 3. Industry Focus (Technical Specification/1.1 System Objectives)
 *    - Implemented in getNetworkByIndustry method
 * 4. Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 *    - Implemented in getNetworkGraphData method
 */