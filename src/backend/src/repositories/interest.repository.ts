import { InterestModel, IInterestDocument } from '../models/interest.model';
import { IInterest, IInterestCreate, IInterestUpdate } from '../../../shared/interfaces/interest.interface';
import { CacheService } from '../services/cache.service';
import { Types } from 'mongoose';

/**
 * Repository class for managing interest-related database operations
 * 
 * @class InterestRepository
 * @description Implements the repository pattern for interest-related database operations
 * 
 * Requirements addressed:
 * - Industry Focus (Technical Specification/1.1 System Objectives): Support interest-based networking
 * - Multi-interest Selection (Technical Specification/1.2 Scope/User Authentication and Profile Management): Enable users to select multiple interests
 * - User-Centric Design (Technical Specification/1.2 Scope/Core Functionalities): Facilitate interest-based user categorization
 */
export class InterestRepository {
  private cacheService: CacheService;
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  /**
   * Creates a new interest in the database
   * @param data The interest data to create
   * @returns The created interest document
   */
  async create(data: IInterestCreate): Promise<IInterest> {
    // Validate interest data
    if (!data.name || !data.category) {
      throw new Error('Interest name and category are required');
    }

    // Create new interest document
    const interest = new InterestModel(data);

    // Save to database
    const savedInterest = await interest.save();

    // Invalidate relevant cache
    await this.cacheService.del(`interests:category:${data.category}`);
    await this.cacheService.del('interests:popular');

    // Return created interest
    return savedInterest.toObject();
  }

  /**
   * Retrieves an interest by its ID, using cache when available
   * @param id The ID of the interest to retrieve
   * @returns The found interest or null
   */
  async findById(id: string): Promise<IInterest | null> {
    // Check cache for interest
    const cachedInterest = await this.cacheService.get<IInterest>(`interest:${id}`);
    if (cachedInterest) {
      return cachedInterest;
    }

    // If not in cache, query database
    const interest = await InterestModel.findById(id);

    // Cache result if found
    if (interest) {
      await this.cacheService.set(`interest:${id}`, interest.toObject(), this.CACHE_TTL);
    }

    // Return interest or null
    return interest ? interest.toObject() : null;
  }

  /**
   * Retrieves all interests within a specific category
   * @param category The category to search for
   * @returns An array of interests in the category
   */
  async findByCategory(category: string): Promise<IInterest[]> {
    // Check cache for category interests
    const cachedInterests = await this.cacheService.get<IInterest[]>(`interests:category:${category}`);
    if (cachedInterests) {
      return cachedInterests;
    }

    // If not in cache, query database
    const interests = await InterestModel.findByCategory(category);

    // Cache results
    await this.cacheService.set(`interests:category:${category}`, interests, this.CACHE_TTL);

    // Return array of interests
    return interests;
  }

  /**
   * Updates an existing interest
   * @param id The ID of the interest to update
   * @param data The update data for the interest
   * @returns The updated interest or null
   */
  async update(id: string, data: IInterestUpdate): Promise<IInterest | null> {
    // Validate update data
    if (Object.keys(data).length === 0) {
      throw new Error('Update data is required');
    }

    // Update interest in database
    const updatedInterest = await InterestModel.findByIdAndUpdate(id, data, { new: true });

    if (updatedInterest) {
      // Invalidate relevant cache
      await this.cacheService.del(`interest:${id}`);
      await this.cacheService.del(`interests:category:${updatedInterest.category}`);
      await this.cacheService.del('interests:popular');

      // Return updated interest
      return updatedInterest.toObject();
    }

    return null;
  }

  /**
   * Deletes an interest by ID
   * @param id The ID of the interest to delete
   * @returns Success status
   */
  async delete(id: string): Promise<boolean> {
    // Delete interest from database
    const deletedInterest = await InterestModel.findByIdAndDelete(id);

    if (deletedInterest) {
      // Invalidate relevant cache
      await this.cacheService.del(`interest:${id}`);
      await this.cacheService.del(`interests:category:${deletedInterest.category}`);
      await this.cacheService.del('interests:popular');

      // Return success status
      return true;
    }

    return false;
  }

  /**
   * Retrieves the most popular interests based on user selection
   * @param limit The maximum number of interests to return
   * @returns An array of popular interests
   */
  async findPopularInterests(limit: number): Promise<IInterest[]> {
    // Check cache for popular interests
    const cachedPopularInterests = await this.cacheService.get<IInterest[]>('interests:popular');
    if (cachedPopularInterests) {
      return cachedPopularInterests.slice(0, limit);
    }

    // If not in cache, aggregate from database
    const popularInterests = await InterestModel.findPopularInterests(limit);

    // Cache results with shorter TTL
    await this.cacheService.set('interests:popular', popularInterests, this.CACHE_TTL / 2);

    // Return popular interests
    return popularInterests;
  }
}

/**
 * @fileoverview This file implements the data access layer for managing interests in the Pollen8 platform,
 * providing methods for CRUD operations and specialized queries for interest-based functionalities.
 * 
 * The InterestRepository class encapsulates all database operations related to interests,
 * utilizing caching mechanisms to optimize performance and reduce database load.
 * 
 * Key features:
 * - CRUD operations for interests
 * - Category-based interest retrieval
 * - Popular interests aggregation
 * - Caching strategy for frequently accessed data
 * 
 * This implementation ensures efficient data access and management for the interest-based
 * networking features of the Pollen8 platform.
 */