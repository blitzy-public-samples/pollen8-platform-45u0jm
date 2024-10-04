import { injectable, inject } from 'inversify';
import { ObjectId } from 'mongodb';
import { NetworkAnalytics, InviteAnalytics, IAnalyticsTimeframe } from '@shared/types/analytics.types';
import { UserRepository } from '../repositories/user.repository';
import { ConnectionRepository } from '../repositories/connection.repository';
import { InviteRepository } from '../repositories/invite.repository';
import { ErrorCode } from '@shared/constants/errorCodes';
import { createValidationError, handleError } from '../utils/errorHandlers';

/**
 * AnalyticsService class
 * @description Implements analytics processing and calculation logic for the Pollen8 platform
 * @class AnalyticsService
 */
@injectable()
export class AnalyticsService {
  private readonly NETWORK_VALUE_PER_CONNECTION = 3.14;

  constructor(
    @inject(UserRepository) private userRepository: UserRepository,
    @inject(ConnectionRepository) private connectionRepository: ConnectionRepository,
    @inject(InviteRepository) private inviteRepository: InviteRepository
  ) {}

  /**
   * Calculates network-related analytics for a user
   * @param {ObjectId} userId - The ID of the user to calculate analytics for
   * @param {IAnalyticsTimeframe} [timeframe] - Optional timeframe for the analytics
   * @returns {Promise<NetworkAnalytics>} Network analytics data for the user
   */
  async calculateNetworkAnalytics(userId: ObjectId, timeframe?: IAnalyticsTimeframe): Promise<NetworkAnalytics> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw createValidationError(ErrorCode.USER_NOT_FOUND);
      }

      const connections = await this.connectionRepository.getUserConnections(userId, timeframe);
      const connectionCount = connections.length;
      const networkValue = this.calculateNetworkValue(connectionCount);
      const growthRate = await this.calculateGrowthRate(userId, connectionCount, timeframe);
      const industryDistribution = await this.calculateIndustryDistribution(userId);

      return {
        userId,
        networkValue,
        connectionCount,
        growthRate,
        industryDistribution
      };
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  /**
   * Retrieves and processes analytics for a specific invite
   * @param {ObjectId} inviteId - The ID of the invite to analyze
   * @returns {Promise<InviteAnalytics>} Analytics data for the invite
   */
  async getInviteAnalytics(inviteId: ObjectId): Promise<InviteAnalytics> {
    try {
      const invite = await this.inviteRepository.findById(inviteId);
      if (!invite) {
        throw createValidationError(ErrorCode.INVITE_NOT_FOUND);
      }

      const clickCount = invite.clickCount;
      const dailyClicks = invite.dailyClickData;
      const conversionRate = await this.calculateConversionRate(inviteId);

      return {
        inviteId,
        clickCount,
        conversionRate,
        dailyClicks
      };
    } catch (error) {
      handleError(error);
      throw error;
    }
  }

  /**
   * Calculates the distribution of connections across industries
   * @param {ObjectId} userId - The ID of the user to calculate for
   * @returns {Promise<Record<string, number>>} Industry distribution percentages
   */
  private async calculateIndustryDistribution(userId: ObjectId): Promise<Record<string, number>> {
    const connections = await this.connectionRepository.getUserConnections(userId);
    const industries: Record<string, number> = {};
    const totalConnections = connections.length;

    connections.forEach(connection => {
      connection.industries.forEach(industry => {
        industries[industry.toString()] = (industries[industry.toString()] || 0) + 1;
      });
    });

    Object.keys(industries).forEach(industry => {
      industries[industry] = (industries[industry] / totalConnections) * 100;
    });

    return industries;
  }

  /**
   * Calculates the growth rate of a user's network
   * @param {ObjectId} userId - The ID of the user to calculate for
   * @param {number} currentCount - The current number of connections
   * @param {IAnalyticsTimeframe} [timeframe] - Optional timeframe for calculation
   * @returns {Promise<number>} Growth rate as a percentage
   */
  private async calculateGrowthRate(userId: ObjectId, currentCount: number, timeframe?: IAnalyticsTimeframe): Promise<number> {
    const previousTimeframe: IAnalyticsTimeframe = this.getPreviousTimeframe(timeframe);
    const previousConnections = await this.connectionRepository.getUserConnections(userId, previousTimeframe);
    const previousCount = previousConnections.length;

    if (previousCount === 0) {
      return currentCount > 0 ? 100 : 0;
    }

    return ((currentCount - previousCount) / previousCount) * 100;
  }

  /**
   * Calculates the network value based on the number of connections
   * @param {number} connectionCount - The number of connections
   * @returns {number} The calculated network value
   */
  private calculateNetworkValue(connectionCount: number): number {
    return connectionCount * this.NETWORK_VALUE_PER_CONNECTION;
  }

  /**
   * Calculates the conversion rate for an invite
   * @param {ObjectId} inviteId - The ID of the invite to calculate for
   * @returns {Promise<number>} The conversion rate as a percentage
   */
  private async calculateConversionRate(inviteId: ObjectId): Promise<number> {
    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite) {
      throw createValidationError(ErrorCode.INVITE_NOT_FOUND);
    }

    const connections = await this.connectionRepository.getConnectionsByInvite(inviteId);
    return (connections.length / invite.clickCount) * 100;
  }

  /**
   * Gets the previous timeframe based on the current timeframe
   * @param {IAnalyticsTimeframe} [currentTimeframe] - The current timeframe
   * @returns {IAnalyticsTimeframe} The previous timeframe
   */
  private getPreviousTimeframe(currentTimeframe?: IAnalyticsTimeframe): IAnalyticsTimeframe {
    if (!currentTimeframe) {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      return { startDate, endDate };
    }

    const duration = currentTimeframe.endDate.getTime() - currentTimeframe.startDate.getTime();
    return {
      startDate: new Date(currentTimeframe.startDate.getTime() - duration),
      endDate: new Date(currentTimeframe.endDate.getTime() - duration)
    };
  }
}

/**
 * This file implements the analytics service for the Pollen8 platform, providing
 * quantifiable insights into network growth, invite performance, and user engagement.
 *
 * Requirements addressed:
 * 1. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Implements network value calculation and tracking
 * 2. Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 *    - Processes and provides data for invite performance tracking
 * 3. Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 *    - Enables measurement and optimization of professional connections
 *
 * Note: This service relies on the UserRepository, ConnectionRepository, and InviteRepository
 * for data access. Ensure these dependencies are properly injected in the IoC container.
 */