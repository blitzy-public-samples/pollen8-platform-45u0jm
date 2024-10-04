import { InviteModel, IInviteDocument } from '../models/invite.model';
import { IInvite, IInviteCreate, IInviteUpdate } from '@shared/interfaces/invite.interface';
import { CacheService } from '../services/cache.service';
import { Types } from 'mongoose';

/**
 * Repository class for handling all data access operations related to invites.
 * This class implements the data access layer for invite-related operations in the Pollen8 platform.
 */
export class InviteRepository {
  private cacheService: CacheService;

  constructor(cacheService: CacheService) {
    this.cacheService = cacheService;
  }

  /**
   * Creates a new invite link in the database.
   * @param data The data for creating a new invite.
   * @returns A Promise resolving to the created invite object.
   */
  async createInvite(data: IInviteCreate): Promise<IInvite> {
    const invite = new InviteModel(data);
    await invite.save();
    await this.invalidateCache(invite.userId.toString());
    return invite.toObject();
  }

  /**
   * Retrieves an invite by its unique code.
   * @param code The unique code of the invite.
   * @returns A Promise resolving to the found invite or null.
   */
  async getInviteByCode(code: string): Promise<IInvite | null> {
    const cacheKey = `invite:${code}`;
    const cachedInvite = await this.cacheService.get<IInvite>(cacheKey);

    if (cachedInvite) {
      return cachedInvite;
    }

    const invite = await InviteModel.findOne({ code }).lean();

    if (invite) {
      await this.cacheService.set(cacheKey, invite, 3600); // Cache for 1 hour
    }

    return invite;
  }

  /**
   * Increments the click count for an invite and updates daily analytics.
   * @param code The unique code of the invite.
   */
  async updateInviteClickCount(code: string): Promise<void> {
    const invite = await InviteModel.findOne({ code });
    if (!invite) {
      throw new Error('Invite not found');
    }

    await invite.updateClickCount(new Date());
    await this.invalidateCache(invite.userId.toString());
    await this.cacheService.del(`invite:${code}`);
  }

  /**
   * Retrieves all invites created by a specific user.
   * @param userId The ID of the user.
   * @returns A Promise resolving to an array of the user's invites.
   */
  async getUserInvites(userId: string): Promise<IInvite[]> {
    const cacheKey = `user:${userId}:invites`;
    const cachedInvites = await this.cacheService.get<IInvite[]>(cacheKey);

    if (cachedInvites) {
      return cachedInvites;
    }

    const invites = await InviteModel.find({ userId }).lean();
    await this.cacheService.set(cacheKey, invites, 1800); // Cache for 30 minutes

    return invites;
  }

  /**
   * Updates an existing invite's properties.
   * @param code The unique code of the invite to update.
   * @param data The data to update the invite with.
   * @returns A Promise resolving to the updated invite or null.
   */
  async updateInvite(code: string, data: IInviteUpdate): Promise<IInvite | null> {
    const invite = await InviteModel.findOneAndUpdate({ code }, data, { new: true }).lean();

    if (invite) {
      await this.invalidateCache(invite.userId.toString());
      await this.cacheService.del(`invite:${code}`);
    }

    return invite;
  }

  /**
   * Retrieves analytics data for a specific invite.
   * @param code The unique code of the invite.
   * @returns A Promise resolving to the analytics data for the invite.
   */
  async getInviteAnalytics(code: string): Promise<InviteAnalytics> {
    const cacheKey = `invite:${code}:analytics`;
    const cachedAnalytics = await this.cacheService.get<InviteAnalytics>(cacheKey);

    if (cachedAnalytics) {
      return cachedAnalytics;
    }

    const invite = await InviteModel.findOne({ code }).lean();
    if (!invite) {
      throw new Error('Invite not found');
    }

    const analytics: InviteAnalytics = {
      totalClicks: invite.clickCount,
      dailyClicks: Object.fromEntries(invite.dailyClickData),
      averageClicksPerDay: this.calculateAverageClicks(invite),
    };

    await this.cacheService.set(cacheKey, analytics, 3600); // Cache for 1 hour

    return analytics;
  }

  private async invalidateCache(userId: string): Promise<void> {
    await this.cacheService.del(`user:${userId}:invites`);
  }

  private calculateAverageClicks(invite: IInvite): number {
    const daysSinceCreation = Math.ceil((Date.now() - invite.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return invite.clickCount / daysSinceCreation;
  }
}

interface InviteAnalytics {
  totalClicks: number;
  dailyClicks: { [date: string]: number };
  averageClicksPerDay: number;
}

/**
 * @fileoverview This file implements the data access layer for invite-related operations in the Pollen8 platform.
 * It handles the creation, retrieval, and analytics tracking of invite links.
 * 
 * Requirements addressed:
 * 1. Trackable Invite Links (Technical Specification/1.2 Scope/Core Functionalities/3)
 *    - Implements data access for invite link generation and tracking
 * 2. Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 *    - Provides data access methods for invite performance tracking
 * 3. One-click Sharing (Technical Specification/1.2 Scope/Core Functionalities/3)
 *    - Ensures efficient storage and retrieval of shareable links
 * 
 * Key features:
 * - Caching layer for improved performance
 * - Detailed analytics retrieval and calculation
 * - Efficient invite management and updating
 * 
 * Note: This repository works in conjunction with the InviteModel and CacheService
 * to provide optimized data access and management for the invite system.
 */