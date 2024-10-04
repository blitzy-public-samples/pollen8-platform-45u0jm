import { injectable, inject } from 'inversify';
import cron from 'node-cron';
import { Logger } from 'winston';
import { AnalyticsService } from '../services/analytics.service';
import CacheService from '../services/cache.service';
import { UserModel } from '../models/user.model';
import { InviteModel } from '../models/invite.model';
import { NetworkAnalytics } from '@shared/types/analytics.types';
import { ObjectId } from 'mongodb';

/**
 * AnalyticsAggregationJob class
 * @description Implements scheduled analytics data aggregation for the Pollen8 platform
 * @class AnalyticsAggregationJob
 * 
 * Requirements addressed:
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives)
 * - Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 * - Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 */
@injectable()
export class AnalyticsAggregationJob {
  private readonly AGGREGATION_SCHEDULE = '0 0 * * *'; // Run daily at midnight
  private readonly CACHE_TTL = 86400; // Cache for 24 hours

  constructor(
    @inject('AnalyticsService') private analyticsService: AnalyticsService,
    @inject('CacheService') private cacheService: CacheService,
    @inject('Logger') private logger: Logger
  ) {}

  /**
   * Initiates the scheduled analytics aggregation job
   */
  public start(): void {
    cron.schedule(this.AGGREGATION_SCHEDULE, async () => {
      this.logger.info('Starting analytics aggregation job');
      await this.aggregateNetworkAnalytics();
      await this.aggregateInviteAnalytics();
      this.logger.info('Analytics aggregation job completed');
    });
    this.logger.info('Analytics aggregation job scheduled');
  }

  /**
   * Aggregates network-related analytics for all users
   */
  private async aggregateNetworkAnalytics(): Promise<void> {
    try {
      const users = await UserModel.find({}).lean();
      this.logger.info(`Aggregating network analytics for ${users.length} users`);

      for (const user of users) {
        const analytics = await this.analyticsService.calculateNetworkAnalytics(user._id);
        await this.updateCachedAnalytics(user._id.toString(), analytics);
      }

      this.logger.info('Network analytics aggregation completed');
    } catch (error) {
      this.logger.error('Error aggregating network analytics:', error);
    }
  }

  /**
   * Aggregates invite performance analytics
   */
  private async aggregateInviteAnalytics(): Promise<void> {
    try {
      const activeInvites = await InviteModel.find({ isActive: true }).lean();
      this.logger.info(`Aggregating invite analytics for ${activeInvites.length} active invites`);

      for (const invite of activeInvites) {
        const analytics = await this.analyticsService.getInviteAnalytics(invite._id);
        await this.cacheService.set(`invite:analytics:${invite._id}`, analytics, this.CACHE_TTL);
      }

      this.logger.info('Invite analytics aggregation completed');
    } catch (error) {
      this.logger.error('Error aggregating invite analytics:', error);
    }
  }

  /**
   * Updates the cached analytics data for a user
   * @param {string} userId - The ID of the user
   * @param {NetworkAnalytics} analytics - The analytics data to cache
   */
  private async updateCachedAnalytics(userId: string, analytics: NetworkAnalytics): Promise<void> {
    try {
      await this.cacheService.set(`user:analytics:${userId}`, analytics, this.CACHE_TTL);
    } catch (error) {
      this.logger.error(`Error updating cached analytics for user ${userId}:`, error);
    }
  }
}

/**
 * This file implements the AnalyticsAggregationJob for the Pollen8 platform.
 * It schedules and runs daily aggregations of network and invite analytics,
 * storing the results in cache for quick access.
 * 
 * The job addresses the following requirements:
 * 1. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Aggregates and updates network value calculations for all users
 * 2. Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 *    - Processes invite performance data for later visualization
 * 3. Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 *    - Generates aggregated metrics for network optimization
 * 
 * Note: This job relies on the AnalyticsService for calculations and the CacheService
 * for storing aggregated data. Ensure these dependencies are properly injected in the IoC container.
 */