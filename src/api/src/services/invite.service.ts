import { ObjectId } from 'mongodb';
import { nanoid } from 'nanoid';
import { IInvite, IInviteCreate, IInviteUpdate, InviteResponse } from '@shared/interfaces/invite.interface';
import { validateInviteCreate, validateInviteUpdate, validateInviteCode } from '@shared/validators/invite.validator';
import { formatResponse } from '@utils/responseFormatter';
import { NETWORK_VALUE_PER_CONNECTION } from '@shared/constants/networkValue';
import { InviteRepository } from '../repositories/invite.repository';
import { CacheService } from './cache.service';
import { WebSocketService } from './websocket.service';
import { ApiError } from '../utils/ApiError';

/**
 * Service class for handling all invite-related operations
 * This class implements the business logic for managing invites in the Pollen8 platform
 */
export class InviteService {
  private inviteRepository: InviteRepository;
  private cacheService: CacheService;
  private webSocketService: WebSocketService;

  constructor(
    inviteRepository: InviteRepository,
    cacheService: CacheService,
    webSocketService: WebSocketService
  ) {
    this.inviteRepository = inviteRepository;
    this.cacheService = cacheService;
    this.webSocketService = webSocketService;
  }

  /**
   * Creates a new invite link for a user
   * @param userId - The ID of the user creating the invite
   * @param name - The name or description of the invite
   * @returns Promise<InviteResponse> - Created invite data
   */
  async createInvite(userId: ObjectId, name: string): Promise<InviteResponse> {
    // Validate input data
    const validationResult = validateInviteCreate({ userId, name });
    if (!validationResult.isValid) {
      throw new ApiError(400, 'Invalid invite data', validationResult.errors);
    }

    // Generate unique invite code
    const code = nanoid(8); // Generate an 8-character unique code

    // Create invite record in database
    const invite: IInvite = {
      _id: new ObjectId(),
      userId,
      name,
      code,
      clickCount: 0,
      dailyClickData: {},
      createdAt: new Date(),
      isActive: true
    };

    const createdInvite = await this.inviteRepository.create(invite);

    // Cache invite data for quick access
    await this.cacheService.setInvite(code, createdInvite);

    // Return formatted invite response
    return formatResponse<InviteResponse>({ invite: createdInvite });
  }

  /**
   * Retrieves analytics data for a specific invite
   * @param inviteId - The ID of the invite
   * @returns Promise<InviteResponse> - Invite data with analytics
   */
  async getInviteAnalytics(inviteId: ObjectId): Promise<InviteResponse> {
    // Check cache for invite analytics
    const cachedAnalytics = await this.cacheService.getInviteAnalytics(inviteId);
    if (cachedAnalytics) {
      return formatResponse<InviteResponse>(cachedAnalytics);
    }

    // If not in cache, fetch from database
    const invite = await this.inviteRepository.findById(inviteId);
    if (!invite) {
      throw new ApiError(404, 'Invite not found');
    }

    // Process daily click data into trend format
    const dailyTrend = Object.entries(invite.dailyClickData).map(([date, clicks]) => ({
      date,
      clicks
    }));

    const analytics = {
      totalClicks: invite.clickCount,
      dailyTrend
    };

    // Cache processed analytics
    await this.cacheService.setInviteAnalytics(inviteId, { invite, analytics });

    // Return formatted analytics response
    return formatResponse<InviteResponse>({ invite, analytics });
  }

  /**
   * Records a click event for an invite link
   * @param code - The unique code of the invite
   * @returns Promise<void>
   */
  async trackInviteClick(code: string): Promise<void> {
    // Validate invite code format
    const validationResult = validateInviteCode(code);
    if (!validationResult.isValid) {
      throw new ApiError(400, 'Invalid invite code', validationResult.errors);
    }

    // Update click count atomically
    const invite = await this.inviteRepository.incrementClickCount(code);
    if (!invite) {
      throw new ApiError(404, 'Invite not found');
    }

    // Update daily click data
    const today = new Date().toISOString().split('T')[0];
    await this.inviteRepository.incrementDailyClickCount(invite._id, today);

    // Invalidate analytics cache
    await this.cacheService.invalidateInviteAnalytics(invite._id);

    // Emit real-time update via WebSocket
    this.webSocketService.emitInviteUpdate(invite.userId, {
      inviteId: invite._id,
      clickCount: invite.clickCount + 1
    });
  }

  /**
   * Updates an existing invite's properties
   * @param inviteId - The ID of the invite to update
   * @param updateData - The data to update
   * @returns Promise<InviteResponse> - Updated invite data
   */
  async updateInvite(inviteId: ObjectId, updateData: IInviteUpdate): Promise<InviteResponse> {
    // Validate update data
    const validationResult = validateInviteUpdate(updateData);
    if (!validationResult.isValid) {
      throw new ApiError(400, 'Invalid update data', validationResult.errors);
    }

    // Update invite in database
    const updatedInvite = await this.inviteRepository.update(inviteId, updateData);
    if (!updatedInvite) {
      throw new ApiError(404, 'Invite not found');
    }

    // Invalidate and update cache
    await this.cacheService.invalidateInvite(updatedInvite.code);
    await this.cacheService.setInvite(updatedInvite.code, updatedInvite);

    // Return formatted update response
    return formatResponse<InviteResponse>({ invite: updatedInvite });
  }

  /**
   * Deactivates an invite link
   * @param inviteId - The ID of the invite to deactivate
   * @returns Promise<InviteResponse> - Deactivated invite data
   */
  async deactivateInvite(inviteId: ObjectId): Promise<InviteResponse> {
    // Set invite isActive to false
    const deactivatedInvite = await this.inviteRepository.update(inviteId, { isActive: false });
    if (!deactivatedInvite) {
      throw new ApiError(404, 'Invite not found');
    }

    // Invalidate and update cache
    await this.cacheService.invalidateInvite(deactivatedInvite.code);
    await this.cacheService.setInvite(deactivatedInvite.code, deactivatedInvite);

    // Return formatted response
    return formatResponse<InviteResponse>({ invite: deactivatedInvite });
  }

  /**
   * Calculates the network value generated by an invite
   * @param invite - The invite object
   * @returns number - The calculated network value
   */
  private calculateNetworkValue(invite: IInvite): number {
    return invite.clickCount * NETWORK_VALUE_PER_CONNECTION;
  }
}

/**
 * @fileoverview This module implements the InviteService class, which handles all invite-related operations for the Pollen8 platform.
 * It addresses the following requirements:
 * 1. Trackable Invite Links (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 2. Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 3. One-click Sharing (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 4. Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 *
 * Key features:
 * - Generate and manage unique invite links
 * - Track and process invite performance data
 * - Provide real-time updates via WebSocket
 * - Implement caching for improved performance
 * - Calculate network value based on invite performance
 *
 * Note: This service assumes the existence of InviteRepository, CacheService, and WebSocketService classes,
 * which should be implemented separately to handle data persistence, caching, and real-time communication respectively.
 */