import { Model, Types } from 'mongoose';
import { Connection, IConnectionDocument } from '../models/connection.model';
import { IConnection, IConnectionCreate, ConnectionStatus } from '@shared/interfaces/connection.interface';
import { ObjectId } from 'mongodb';

/**
 * Interface for connection query options
 */
interface ConnectionQueryOptions {
  status?: ConnectionStatus;
  industry?: string;
  limit?: number;
  offset?: number;
}

/**
 * ConnectionRepository class
 * @description Implements the repository pattern for connection data management
 */
export class ConnectionRepository {
  private model: Model<IConnectionDocument>;

  constructor() {
    this.model = Connection;
  }

  /**
   * Creates a new connection between two users
   * @param data The connection data to create
   * @returns The created connection
   */
  async create(data: IConnectionCreate): Promise<IConnection> {
    const connection = new this.model(data);
    await connection.save();
    return connection.toObject();
  }

  /**
   * Finds a connection by its unique identifier
   * @param id The connection ID
   * @returns The found connection or null
   */
  async findById(id: string): Promise<IConnection | null> {
    const connection = await this.model.findById(id);
    return connection ? connection.toObject() : null;
  }

  /**
   * Finds a connection between two specific users
   * @param userId The ID of the first user
   * @param connectedUserId The ID of the second user
   * @returns The found connection or null
   */
  async findByUsers(userId: string, connectedUserId: string): Promise<IConnection | null> {
    const connection = await this.model.findOne({
      $or: [
        { userId: userId, connectedUserId: connectedUserId },
        { userId: connectedUserId, connectedUserId: userId }
      ]
    });
    return connection ? connection.toObject() : null;
  }

  /**
   * Finds all connections for a specific user
   * @param userId The ID of the user
   * @param options Query options for filtering and pagination
   * @returns Array of connections
   */
  async findByUser(userId: string, options: ConnectionQueryOptions): Promise<IConnection[]> {
    let query = this.model.find({
      $or: [{ userId: userId }, { connectedUserId: userId }]
    });

    if (options.status) {
      query = query.byStatus(options.status);
    }

    if (options.industry) {
      query = query.byIndustry(options.industry);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.skip(options.offset);
    }

    const connections = await query.exec();
    return connections.map(connection => connection.toObject());
  }

  /**
   * Updates the status of a connection
   * @param id The connection ID
   * @param status The new connection status
   * @returns The updated connection
   */
  async updateStatus(id: string, status: ConnectionStatus): Promise<IConnection> {
    const connection = await this.model.findByIdAndUpdate(
      id,
      { status: status },
      { new: true, runValidators: true }
    );
    if (!connection) {
      throw new Error('Connection not found');
    }
    return connection.toObject();
  }

  /**
   * Deletes a connection by its ID
   * @param id The connection ID
   * @returns True if deletion was successful
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.model.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }

  /**
   * Calculates the total network value for a user
   * @param userId The ID of the user
   * @returns The total network value
   */
  async calculateNetworkValue(userId: string): Promise<number> {
    const connections = await this.model.find({
      $or: [{ userId: userId }, { connectedUserId: userId }],
      status: ConnectionStatus.ACCEPTED
    });
    return connections.length * connections[0]?.networkValue || 0;
  }

  /**
   * Finds connections by shared industry
   * @param industry The industry to search for
   * @returns Array of connections sharing the specified industry
   */
  async findBySharedIndustry(industry: string): Promise<IConnection[]> {
    const connections = await this.model.findByIndustry(industry);
    return connections.map(connection => connection.toObject());
  }

  /**
   * Counts the number of connections for a user
   * @param userId The ID of the user
   * @param status Optional connection status to filter by
   * @returns The number of connections
   */
  async countConnections(userId: string, status?: ConnectionStatus): Promise<number> {
    const query: any = {
      $or: [{ userId: userId }, { connectedUserId: userId }]
    };
    if (status) {
      query.status = status;
    }
    return this.model.countDocuments(query);
  }
}

/**
 * @fileoverview This file implements the ConnectionRepository class, which provides an abstraction layer
 * for connection-related database operations in the Pollen8 platform.
 * 
 * Requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives): Implements data access layer for managing authentic professional connections
 * 2. Industry Focus (Technical Specification/1.1 System Objectives): Enables industry-specific connection querying and management
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives): Supports network value calculation through connection management
 */