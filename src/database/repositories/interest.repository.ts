import { injectable } from 'inversify';
import { IRepository } from '../interfaces/repository.interface';
import { InterestModel, IInterestDocument } from '../models/interest.model';
import { FilterOptions, QueryOptions } from '../types/query.types';
import { buildQuery, executeQuery } from '../utils/query.util';
import { CacheUtil, withCache } from '../utils/caching.util';
import { Logger } from '../utils/logger';

/**
 * Repository implementation for managing interest data in the MongoDB database.
 * This class implements the IRepository interface for the Interest model.
 * 
 * Requirements addressed:
 * 1. Industry Focus (Technical Specification/1.1 System Objectives): Enable targeted networking through interest management
 * 2. User-Centric Design (Technical Specification/1.2 Scope/User Authentication and Profile Management): Support interest-based user profiling
 * 3. Data Access Layer (Technical Specification/2.3.2 Backend Components/DataAccessLayer): Implement standardized data access for interests
 */
@injectable()
export class InterestRepository implements IRepository<IInterestDocument> {
  private cacheUtil: CacheUtil;
  private logger: Logger;

  constructor(cacheUtil: CacheUtil, logger: Logger) {
    this.cacheUtil = cacheUtil;
    this.logger = logger;
  }

  /**
   * Retrieves multiple interest documents based on filter criteria.
   * 
   * @param filter - The filter criteria to apply
   * @param options - Additional query options
   * @returns A promise that resolves to an array of interest documents
   */
  @withCache('interests')
  async find(filter: FilterOptions<IInterestDocument>, options?: QueryOptions): Promise<IInterestDocument[]> {
    try {
      const query = buildQuery(InterestModel, filter, options);
      return await executeQuery(query);
    } catch (error) {
      this.logger.error('Error in InterestRepository.find', { error, filter, options });
      throw error;
    }
  }

  /**
   * Retrieves a single interest document based on filter criteria.
   * 
   * @param filter - The filter criteria to apply
   * @param options - Additional query options
   * @returns A promise that resolves to a single interest document or null if not found
   */
  @withCache('interest')
  async findOne(filter: FilterOptions<IInterestDocument>, options?: QueryOptions): Promise<IInterestDocument | null> {
    try {
      const query = buildQuery(InterestModel, filter, options).limit(1);
      const results = await executeQuery(query);
      return results[0] || null;
    } catch (error) {
      this.logger.error('Error in InterestRepository.findOne', { error, filter, options });
      throw error;
    }
  }

  /**
   * Creates a new interest document in the database.
   * 
   * @param data - The data to create the new interest
   * @returns A promise that resolves to the created interest document
   */
  async create(data: Partial<IInterestDocument>): Promise<IInterestDocument> {
    try {
      const interest = new InterestModel(data);
      await interest.save();
      await this.cacheUtil.invalidatePrefix('interests');
      return interest;
    } catch (error) {
      this.logger.error('Error in InterestRepository.create', { error, data });
      throw error;
    }
  }

  /**
   * Updates an existing interest document.
   * 
   * @param filter - The filter criteria to find the interest to update
   * @param data - The data to update the interest with
   * @param options - Additional update options
   * @returns A promise that resolves to the updated interest document
   */
  async update(filter: FilterOptions<IInterestDocument>, data: Partial<IInterestDocument>, options?: QueryOptions): Promise<IInterestDocument> {
    try {
      const interest = await InterestModel.findOneAndUpdate(filter, data, { new: true, ...options });
      if (!interest) {
        throw new Error('Interest not found');
      }
      await this.cacheUtil.invalidatePrefix('interests');
      return interest;
    } catch (error) {
      this.logger.error('Error in InterestRepository.update', { error, filter, data, options });
      throw error;
    }
  }

  /**
   * Deletes an interest document from the database.
   * 
   * @param filter - The filter criteria to find the interest to delete
   * @returns A promise that resolves to true if deletion was successful
   */
  async delete(filter: FilterOptions<IInterestDocument>): Promise<boolean> {
    try {
      const result = await InterestModel.deleteOne(filter);
      await this.cacheUtil.invalidatePrefix('interests');
      return result.deletedCount > 0;
    } catch (error) {
      this.logger.error('Error in InterestRepository.delete', { error, filter });
      throw error;
    }
  }

  /**
   * Counts the number of interest documents matching the filter criteria.
   * 
   * @param filter - The filter criteria to apply
   * @returns A promise that resolves to the number of matching documents
   */
  @withCache('interests-count')
  async count(filter: FilterOptions<IInterestDocument>): Promise<number> {
    try {
      return await InterestModel.countDocuments(filter);
    } catch (error) {
      this.logger.error('Error in InterestRepository.count', { error, filter });
      throw error;
    }
  }
}

/**
 * @fileoverview This file implements the InterestRepository class, which provides
 * methods for interacting with interest data in the MongoDB database. It follows
 * the repository pattern and implements the IRepository interface.
 * 
 * Key features:
 * - CRUD operations for interest documents
 * - Caching support for improved performance
 * - Error logging for better debugging and monitoring
 * - Implements industry focus and user-centric design requirements
 * 
 * The repository uses dependency injection for CacheUtil and Logger, allowing
 * for easier testing and flexibility in implementation.
 */