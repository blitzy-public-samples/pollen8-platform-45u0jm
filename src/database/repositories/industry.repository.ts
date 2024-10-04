import { injectable } from 'inversify';
import { Collection, Db } from 'mongodb';
import { IRepository } from '../interfaces/repository.interface';
import { IndustryModel, IIndustryDocument } from '../models/industry.model';
import { INDUSTRIES_COLLECTION } from '../constants/collections';
import { buildQuery, executeQuery } from '../utils/query.util';
import { FilterOptions, QueryOptions, UpdateOptions } from '../types/query.types';

/**
 * Repository class for managing industry data in the MongoDB database.
 * Implements the IRepository interface for standardized CRUD operations.
 * 
 * @class IndustryRepository
 * @implements {IRepository<IIndustryDocument>}
 * 
 * @requirement Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus)
 * @requirement Multi-industry Selection (Technical Specification/1.2 Scope/Core Functionalities)
 * @requirement Data Access Layer (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
@injectable()
export class IndustryRepository implements IRepository<IIndustryDocument> {
  private collection: Collection<IIndustryDocument>;

  /**
   * Creates an instance of IndustryRepository.
   * Initializes the MongoDB collection for industries.
   * 
   * @param {Db} db - MongoDB database instance
   */
  constructor(db: Db) {
    this.collection = db.collection<IIndustryDocument>(INDUSTRIES_COLLECTION);
  }

  /**
   * Retrieves multiple industry documents based on filter criteria.
   * 
   * @param {FilterOptions<IIndustryDocument>} filter - The filter criteria to apply
   * @param {QueryOptions} [options] - Additional query options
   * @returns {Promise<IIndustryDocument[]>} A promise that resolves to an array of industry documents
   */
  async find(filter: FilterOptions<IIndustryDocument>, options?: QueryOptions): Promise<IIndustryDocument[]> {
    const query = buildQuery(filter, options);
    return executeQuery(this.collection.find(query), options);
  }

  /**
   * Retrieves a single industry document based on filter criteria.
   * 
   * @param {FilterOptions<IIndustryDocument>} filter - The filter criteria to apply
   * @param {QueryOptions} [options] - Additional query options
   * @returns {Promise<IIndustryDocument | null>} A promise that resolves to a single industry document or null
   */
  async findOne(filter: FilterOptions<IIndustryDocument>, options?: QueryOptions): Promise<IIndustryDocument | null> {
    const query = buildQuery(filter, options);
    return this.collection.findOne(query, options);
  }

  /**
   * Creates a new industry document in the database.
   * 
   * @param {Partial<IIndustryDocument>} data - The data to create the new industry document
   * @returns {Promise<IIndustryDocument>} A promise that resolves to the created industry document
   */
  async create(data: Partial<IIndustryDocument>): Promise<IIndustryDocument> {
    const industry = new IndustryModel(data);
    await industry.save();
    return industry;
  }

  /**
   * Updates an existing industry document.
   * 
   * @param {FilterOptions<IIndustryDocument>} filter - The filter criteria to apply
   * @param {Partial<IIndustryDocument>} data - The data to update
   * @param {UpdateOptions} [options] - Additional update options
   * @returns {Promise<IIndustryDocument>} A promise that resolves to the updated industry document
   */
  async update(filter: FilterOptions<IIndustryDocument>, data: Partial<IIndustryDocument>, options?: UpdateOptions): Promise<IIndustryDocument> {
    const query = buildQuery(filter);
    const updateResult = await this.collection.findOneAndUpdate(
      query,
      { $set: data },
      { ...options, returnDocument: 'after' }
    );
    if (!updateResult.value) {
      throw new Error('Industry not found');
    }
    return updateResult.value;
  }

  /**
   * Deletes an industry document from the database.
   * 
   * @param {FilterOptions<IIndustryDocument>} filter - The filter criteria to apply
   * @returns {Promise<boolean>} A promise that resolves to true if deletion was successful
   */
  async delete(filter: FilterOptions<IIndustryDocument>): Promise<boolean> {
    const query = buildQuery(filter);
    const result = await this.collection.deleteOne(query);
    return result.deletedCount > 0;
  }

  /**
   * Counts the number of industry documents matching the filter criteria.
   * 
   * @param {FilterOptions<IIndustryDocument>} filter - The filter criteria to apply
   * @returns {Promise<number>} A promise that resolves to the number of matching documents
   */
  async count(filter: FilterOptions<IIndustryDocument>): Promise<number> {
    const query = buildQuery(filter);
    return this.collection.countDocuments(query);
  }
}

/**
 * @fileoverview This file implements the repository pattern for industry data access in MongoDB.
 * It provides methods for CRUD operations on industry documents, supporting the platform's
 * industry-focused networking features.
 * 
 * Key features and requirements addressed:
 * 1. Industry Focus: Enables data access for industry-specific networking (Technical Specification/1.1 System Objectives/Industry Focus)
 * 2. Multi-industry Selection: Supports operations for managing multiple industries (Technical Specification/1.2 Scope/Core Functionalities)
 * 3. Data Access Layer: Implements standardized data access for industries (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 * 
 * The repository uses dependency injection for better testability and follows the interface
 * defined in IRepository for consistent data access patterns across the application.
 * It leverages MongoDB's native driver for optimal performance and flexibility in querying.
 */