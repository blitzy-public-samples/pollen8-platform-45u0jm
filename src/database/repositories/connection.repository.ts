import { injectable } from 'inversify';
import { IRepository } from '../interfaces/repository.interface';
import { ConnectionModel, IConnectionDocument } from '../models/connection.model';
import { FilterOptions, QueryOptions, UpdateOptions } from '../types/query.types';
import { buildQuery, executeQuery } from '../utils/query.util';
import { CacheUtil, withCache } from '../utils/caching.util';
import { Logger } from '../utils/logger';
import { IConnection } from '../../shared/interfaces/connection.interface';

/**
 * Repository implementation for managing connection data in the Pollen8 platform.
 * This class provides a standardized interface for connection-related database operations.
 * 
 * @implements {IRepository<IConnectionDocument>}
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 * - Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus)
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 * - Data Access Layer (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
@injectable()
export class ConnectionRepository implements IRepository<IConnectionDocument> {
  private cacheUtil: CacheUtil;
  private logger: Logger;

  constructor(cacheUtil: CacheUtil, logger: Logger) {
    this.cacheUtil = cacheUtil;
    this.logger = logger;
  }

  /**
   * Retrieves multiple connections based on filter criteria.
   * 
   * @param {FilterOptions<IConnection>} filter - The filter criteria to apply
   * @param {QueryOptions} options - Additional query options
   * @returns {Promise<IConnectionDocument[]>} Array of connections matching the filter criteria
   */
  @withCache('connections')
  async find(filter: FilterOptions<IConnection>, options?: QueryOptions): Promise<IConnectionDocument[]> {
    try {
      const query = buildQuery(ConnectionModel, filter, options);
      return await executeQuery(query);
    } catch (error) {
      this.logger.error('Error in ConnectionRepository.find', { error, filter, options });
      throw error;
    }
  }

  /**
   * Retrieves a single connection based on filter criteria.
   * 
   * @param {FilterOptions<IConnection>} filter - The filter criteria to apply
   * @param {QueryOptions} options - Additional query options
   * @returns {Promise<IConnectionDocument | null>} Single connection matching the filter criteria or null if not found
   */
  @withCache('connection')
  async findOne(filter: FilterOptions<IConnection>, options?: QueryOptions): Promise<IConnectionDocument | null> {
    try {
      const query = buildQuery(ConnectionModel, filter, options);
      return await query.findOne().exec();
    } catch (error) {
      this.logger.error('Error in ConnectionRepository.findOne', { error, filter, options });
      throw error;
    }
  }

  /**
   * Creates a new connection between users.
   * 
   * @param {Partial<IConnection>} data - The connection data to create
   * @returns {Promise<IConnectionDocument>} The created connection
   */
  async create(data: Partial<IConnection>): Promise<IConnectionDocument> {
    try {
      const connection = new ConnectionModel(data);
      await connection.save();
      await this.cacheUtil.invalidateCache('connections');
      return connection;
    } catch (error) {
      this.logger.error('Error in ConnectionRepository.create', { error, data });
      throw error;
    }
  }

  /**
   * Updates an existing connection.
   * 
   * @param {FilterOptions<IConnection>} filter - The filter to find the connection to update
   * @param {Partial<IConnection>} data - The data to update
   * @param {UpdateOptions} options - Additional update options
   * @returns {Promise<IConnectionDocument>} The updated connection
   */
  async update(filter: FilterOptions<IConnection>, data: Partial<IConnection>, options?: UpdateOptions): Promise<IConnectionDocument> {
    try {
      const connection = await ConnectionModel.findOneAndUpdate(filter, data, { new: true, ...options }).exec();
      if (!connection) {
        throw new Error('Connection not found');
      }
      await this.cacheUtil.invalidateCache('connections');
      return connection;
    } catch (error) {
      this.logger.error('Error in ConnectionRepository.update', { error, filter, data, options });
      throw error;
    }
  }

  /**
   * Deletes a connection between users.
   * 
   * @param {FilterOptions<IConnection>} filter - The filter to find the connection to delete
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async delete(filter: FilterOptions<IConnection>): Promise<boolean> {
    try {
      const result = await ConnectionModel.deleteOne(filter).exec();
      await this.cacheUtil.invalidateCache('connections');
      return result.deletedCount > 0;
    } catch (error) {
      this.logger.error('Error in ConnectionRepository.delete', { error, filter });
      throw error;
    }
  }

  /**
   * Counts the number of connections matching the filter criteria.
   * 
   * @param {FilterOptions<IConnection>} filter - The filter criteria to apply
   * @returns {Promise<number>} The number of connections matching the filter criteria
   */
  @withCache('connectionCount')
  async count(filter: FilterOptions<IConnection>): Promise<number> {
    try {
      return await ConnectionModel.countDocuments(filter).exec();
    } catch (error) {
      this.logger.error('Error in ConnectionRepository.count', { error, filter });
      throw error;
    }
  }

  /**
   * Retrieves all connections for a specific user.
   * 
   * @param {string} userId - The ID of the user
   * @param {QueryOptions} options - Additional query options
   * @returns {Promise<IConnectionDocument[]>} Array of connections for the specified user
   */
  @withCache('userConnections')
  async findByUser(userId: string, options?: QueryOptions): Promise<IConnectionDocument[]> {
    try {
      const filter = { $or: [{ userId }, { connectedUserId: userId }] };
      const query = buildQuery(ConnectionModel, filter, options);
      return await executeQuery(query);
    } catch (error) {
      this.logger.error('Error in ConnectionRepository.findByUser', { error, userId, options });
      throw error;
    }
  }

  /**
   * Retrieves connections filtered by industry.
   * 
   * @param {string} industryId - The ID of the industry
   * @param {QueryOptions} options - Additional query options
   * @returns {Promise<IConnectionDocument[]>} Array of connections for the specified industry
   */
  @withCache('industryConnections')
  async findByIndustry(industryId: string, options?: QueryOptions): Promise<IConnectionDocument[]> {
    try {
      const filter = { sharedIndustries: industryId };
      const query = buildQuery(ConnectionModel, filter, options);
      return await executeQuery(query);
    } catch (error) {
      this.logger.error('Error in ConnectionRepository.findByIndustry', { error, industryId, options });
      throw error;
    }
  }
}

/**
 * @fileoverview This file implements the repository pattern for connection-related database operations
 * in the Pollen8 platform. It provides methods for CRUD operations on connections, as well as
 * specialized queries for user-specific and industry-specific connections.
 * 
 * The implementation includes caching strategies to optimize performance and reduce database load.
 * Error logging is implemented to facilitate debugging and monitoring.
 * 
 * This repository addresses the following requirements:
 * - Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 * - Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus)
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 * - Data Access Layer (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */