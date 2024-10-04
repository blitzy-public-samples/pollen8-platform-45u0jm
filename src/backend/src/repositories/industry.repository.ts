import { Model } from 'mongoose';
import { IIndustry, IIndustryCreate, IIndustryUpdate } from '../../../shared/interfaces/industry.interface';
import { IndustryModel } from '../../database/models/industry.model';
import { DatabaseError } from '../utils/errorHandlers';

/**
 * Repository class for handling industry-related database operations
 * @description Implements the repository pattern for industry-related database operations
 * @requirement Industry Focus (Technical Specification/1.1 System Objectives)
 * @requirement Multi-industry selection (Technical Specification/1.2 Scope/Core Functionalities)
 * @requirement Industry-specific networks (Technical Specification/1.2 Scope/Core Functionalities)
 */
export class IndustryRepository {
  private model: Model<IIndustry>;

  constructor(model: Model<IIndustry> = IndustryModel) {
    this.model = model;
  }

  /**
   * Creates a new industry record in the database
   * @param data The industry data to be created
   * @returns Promise resolving to the created industry record
   * @throws DatabaseError if the creation fails
   */
  async create(data: IIndustryCreate): Promise<IIndustry> {
    try {
      const industry = new this.model(data);
      return await industry.save();
    } catch (error) {
      throw new DatabaseError('Failed to create industry', error);
    }
  }

  /**
   * Retrieves an industry by its ID
   * @param id The ID of the industry to retrieve
   * @returns Promise resolving to the found industry or null if not found
   * @throws DatabaseError if the retrieval fails
   */
  async findById(id: string): Promise<IIndustry | null> {
    try {
      return await this.model.findById(id).exec();
    } catch (error) {
      throw new DatabaseError('Failed to find industry by ID', error);
    }
  }

  /**
   * Retrieves an industry by its name
   * @param name The name of the industry to retrieve
   * @returns Promise resolving to the found industry or null if not found
   * @throws DatabaseError if the retrieval fails
   */
  async findByName(name: string): Promise<IIndustry | null> {
    try {
      return await this.model.findOne({ name }).exec();
    } catch (error) {
      throw new DatabaseError('Failed to find industry by name', error);
    }
  }

  /**
   * Retrieves all industries from the database
   * @returns Promise resolving to an array of all industries
   * @throws DatabaseError if the retrieval fails
   */
  async findAll(): Promise<IIndustry[]> {
    try {
      return await this.model.find().exec();
    } catch (error) {
      throw new DatabaseError('Failed to find all industries', error);
    }
  }

  /**
   * Updates an existing industry record
   * @param id The ID of the industry to update
   * @param data The updated industry data
   * @returns Promise resolving to the updated industry or null if not found
   * @throws DatabaseError if the update fails
   */
  async update(id: string, data: IIndustryUpdate): Promise<IIndustry | null> {
    try {
      return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    } catch (error) {
      throw new DatabaseError('Failed to update industry', error);
    }
  }

  /**
   * Deletes an industry record from the database
   * @param id The ID of the industry to delete
   * @returns Promise resolving to true if deleted, false otherwise
   * @throws DatabaseError if the deletion fails
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.model.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (error) {
      throw new DatabaseError('Failed to delete industry', error);
    }
  }
}

/**
 * @fileoverview This file implements the data access layer for industry-related operations in the Pollen8 platform.
 * It provides methods to create, read, update, and delete industry records in the MongoDB database.
 * 
 * Key requirements addressed:
 * 1. Industry Focus (Technical Specification/1.1 System Objectives)
 * 2. Multi-industry selection (Technical Specification/1.2 Scope/Core Functionalities)
 * 3. Industry-specific networks (Technical Specification/1.2 Scope/Core Functionalities)
 * 
 * The IndustryRepository class encapsulates all database operations related to industries,
 * providing a clean interface for the service layer to interact with the database.
 */