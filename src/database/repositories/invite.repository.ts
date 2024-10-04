import { Document } from 'mongoose';
import { IRepository } from '../interfaces/repository.interface';
import { InviteModel, IInviteDocument } from '../models/invite.model';
import { FilterOptions, QueryOptions, UpdateOptions } from '../types/query.types';
import { buildQuery, executeQuery } from '../utils/query.util';
import { CacheStrategyManager } from '../cache/strategies';
import { IInvite } from '@shared/interfaces/invite.interface';
import { InviteAnalytics } from '@shared/types/analytics.types';
import { logger } from '../utils/logger';

/**
 * Repository implementation for invite-related database operations.
 * @implements {IRepository<IInviteDocument>}
 */
export class InviteRepository implements IRepository<IInviteDocument> {
  private cacheManager: CacheStrategyManager;
  private model = InviteModel;

  constructor(cacheManager: CacheStrategyManager) {
    this.cacheManager = cacheManager;
  }

  /**
   * Retrieves multiple invite documents based on filter criteria.
   * @param {FilterOptions<IInvite>} filter - The filter criteria to apply
   * @param {QueryOptions} [options] - Additional query options
   * @returns {Promise<IInviteDocument[]>} Array of invite documents matching the filter criteria
   */
  async find(filter: FilterOptions<IInvite>, options?: QueryOptions): Promise<IInviteDocument[]> {
    const cacheKey = `invites:${JSON.stringify(filter)}:${JSON.stringify(options)}`;
    const cachedResult = await this.cacheManager.get<IInviteDocument[]>(cacheKey);

    if (cachedResult) {
      logger.debug('Cache hit for invite find operation', { filter, options });
      return cachedResult;
    }

    const query = buildQuery(this.model.find(filter), options);
    const result = await executeQuery(query);

    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  /**
   * Retrieves a single invite document based on filter criteria.
   * @param {FilterOptions<IInvite>} filter - The filter criteria to apply
   * @param {QueryOptions} [options] - Additional query options
   * @returns {Promise<IInviteDocument | null>} Single invite document or null if not found
   */
  async findOne(filter: FilterOptions<IInvite>, options?: QueryOptions): Promise<IInviteDocument | null> {
    const cacheKey = `invite:${JSON.stringify(filter)}:${JSON.stringify(options)}`;
    const cachedResult = await this.cacheManager.get<IInviteDocument | null>(cacheKey);

    if (cachedResult) {
      logger.debug('Cache hit for invite findOne operation', { filter, options });
      return cachedResult;
    }

    const query = buildQuery(this.model.findOne(filter), options);
    const result = await executeQuery(query);

    if (result) {
      await this.cacheManager.set(cacheKey, result);
    }
    return result;
  }

  /**
   * Creates a new invite document.
   * @param {Partial<IInvite>} data - The data to create the new invite
   * @returns {Promise<IInviteDocument>} The created invite document
   */
  async create(data: Partial<IInvite>): Promise<IInviteDocument> {
    const code = await InviteModel.generateUniqueCode();
    const newInvite = new this.model({ ...data, code });
    const savedInvite = await newInvite.save();

    await this.cacheManager.invalidate(`invites:${savedInvite.userId}`);
    return savedInvite;
  }

  /**
   * Updates an existing invite document.
   * @param {FilterOptions<IInvite>} filter - The filter criteria to apply
   * @param {Partial<IInvite>} data - The data to update
   * @param {UpdateOptions} [options] - Additional update options
   * @returns {Promise<IInviteDocument>} The updated invite document
   */
  async update(filter: FilterOptions<IInvite>, data: Partial<IInvite>, options?: UpdateOptions): Promise<IInviteDocument> {
    const updatedInvite = await this.model.findOneAndUpdate(filter, data, { new: true, ...options });

    if (updatedInvite) {
      await this.cacheManager.invalidate(`invite:${updatedInvite._id}`);
      await this.cacheManager.invalidate(`invites:${updatedInvite.userId}`);
    }

    return updatedInvite as IInviteDocument;
  }

  /**
   * Deletes an invite document.
   * @param {FilterOptions<IInvite>} filter - The filter criteria to apply
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async delete(filter: FilterOptions<IInvite>): Promise<boolean> {
    const result = await this.model.deleteOne(filter);

    if (result.deletedCount > 0) {
      const invite = await this.findOne(filter);
      if (invite) {
        await this.cacheManager.invalidate(`invite:${invite._id}`);
        await this.cacheManager.invalidate(`invites:${invite.userId}`);
      }
      return true;
    }

    return false;
  }

  /**
   * Increments the click count for an invite link.
   * @param {string} code - The unique code of the invite
   * @returns {Promise<void>}
   */
  async incrementClickCount(code: string): Promise<void> {
    const invite = await this.findOne({ code });
    if (invite) {
      await invite.incrementClickCount();
      await this.cacheManager.invalidate(`invite:${invite._id}`);
      await this.cacheManager.invalidate(`invites:${invite.userId}`);
    }
  }

  /**
   * Retrieves analytics data for a user's invites.
   * @param {string} userId - The ID of the user
   * @returns {Promise<InviteAnalytics>} Analytics data for user's invites
   */
  async getAnalytics(userId: string): Promise<InviteAnalytics> {
    const cacheKey = `inviteAnalytics:${userId}`;
    const cachedResult = await this.cacheManager.get<InviteAnalytics>(cacheKey);

    if (cachedResult) {
      logger.debug('Cache hit for invite analytics', { userId });
      return cachedResult;
    }

    const invites = await this.find({ userId });
    const totalClicks = invites.reduce((sum, invite) => sum + invite.clickCount, 0);
    const dailyClicks = invites.reduce((acc, invite) => {
      Object.entries(invite.dailyClickData).forEach(([date, clicks]) => {
        acc[date] = (acc[date] || 0) + clicks;
      });
      return acc;
    }, {} as Record<string, number>);

    const analytics: InviteAnalytics = {
      totalInvites: invites.length,
      totalClicks,
      dailyClicks,
    };

    await this.cacheManager.set(cacheKey, analytics, 3600); // Cache for 1 hour
    return analytics;
  }

  /**
   * Counts the number of documents that match the specified filter criteria.
   * @param {FilterOptions<IInvite>} filter - The filter criteria to apply
   * @returns {Promise<number>} The number of documents matching the filter criteria
   */
  async count(filter: FilterOptions<IInvite>): Promise<number> {
    return this.model.countDocuments(filter);
  }
}

/**
 * @fileoverview This file implements the invite data access layer, providing a repository pattern interface
 * for managing invite-related database operations in the Pollen8 platform.
 * 
 * Requirements addressed:
 * 1. Trackable Invite Links (Technical Specification/1.2 Scope/Core Functionalities/3):
 *    Implements data access for invite tracking
 * 2. Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3):
 *    Provides methods for retrieving invite analytics data
 * 3. Invite Management (Technical Specification/1.2 Scope/Core Functionalities/3):
 *    Handles CRUD operations for invite links
 * 
 * Notes:
 * - The repository uses a cache strategy manager to optimize read operations and reduce database load
 * - The incrementClickCount method provides real-time updating of click analytics
 * - The getAnalytics method aggregates invite data for user-specific analytics
 * - Error handling and logging are implemented to ensure robust operation and easy debugging
 */