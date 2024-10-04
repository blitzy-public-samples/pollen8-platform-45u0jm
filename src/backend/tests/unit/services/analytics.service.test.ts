import { ObjectId } from 'mongodb';
import { AnalyticsService } from '../../../src/services/analytics.service';
import { UserRepository } from '../../../src/repositories/user.repository';
import { ConnectionRepository } from '../../../src/repositories/connection.repository';
import { InviteRepository } from '../../../src/repositories/invite.repository';
import { NetworkAnalytics, InviteAnalytics } from '@shared/types/analytics.types';
import { ErrorCode } from '@shared/constants/errorCodes';
import { createValidationError } from '../../../src/utils/errorHandlers';

// Mock the repositories
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/repositories/connection.repository');
jest.mock('../../../src/repositories/invite.repository');

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockConnectionRepo: jest.Mocked<ConnectionRepository>;
  let mockInviteRepo: jest.Mocked<InviteRepository>;

  beforeEach(() => {
    mockUserRepo = new UserRepository() as jest.Mocked<UserRepository>;
    mockConnectionRepo = new ConnectionRepository() as jest.Mocked<ConnectionRepository>;
    mockInviteRepo = new InviteRepository() as jest.Mocked<InviteRepository>;
    analyticsService = new AnalyticsService(mockUserRepo, mockConnectionRepo, mockInviteRepo);
  });

  describe('calculateNetworkAnalytics', () => {
    it('should calculate correct network value', async () => {
      const userId = new ObjectId();
      const connections = [
        { _id: new ObjectId(), userId, connectedUserId: new ObjectId(), industries: [new ObjectId()] },
        { _id: new ObjectId(), userId, connectedUserId: new ObjectId(), industries: [new ObjectId()] },
        { _id: new ObjectId(), userId, connectedUserId: new ObjectId(), industries: [new ObjectId()] },
      ];

      mockUserRepo.findById.mockResolvedValue({ _id: userId, phoneNumber: '1234567890' });
      mockConnectionRepo.getUserConnections.mockResolvedValue(connections);

      const result = await analyticsService.calculateNetworkAnalytics(userId);

      expect(result.networkValue).toBeCloseTo(9.42, 2); // 3 connections * 3.14
      expect(result.connectionCount).toBe(3);
    });

    it('should handle timeframe filtering', async () => {
      const userId = new ObjectId();
      const timeframe = { startDate: new Date('2023-01-01'), endDate: new Date('2023-12-31') };
      
      mockUserRepo.findById.mockResolvedValue({ _id: userId, phoneNumber: '1234567890' });
      mockConnectionRepo.getUserConnections.mockResolvedValue([]);

      await analyticsService.calculateNetworkAnalytics(userId, timeframe);

      expect(mockConnectionRepo.getUserConnections).toHaveBeenCalledWith(userId, timeframe);
    });

    it('should calculate industry distribution', async () => {
      const userId = new ObjectId();
      const industryId1 = new ObjectId();
      const industryId2 = new ObjectId();
      const connections = [
        { _id: new ObjectId(), userId, connectedUserId: new ObjectId(), industries: [industryId1] },
        { _id: new ObjectId(), userId, connectedUserId: new ObjectId(), industries: [industryId1, industryId2] },
        { _id: new ObjectId(), userId, connectedUserId: new ObjectId(), industries: [industryId2] },
      ];

      mockUserRepo.findById.mockResolvedValue({ _id: userId, phoneNumber: '1234567890' });
      mockConnectionRepo.getUserConnections.mockResolvedValue(connections);

      const result = await analyticsService.calculateNetworkAnalytics(userId);

      expect(result.industryDistribution[industryId1.toString()]).toBeCloseTo(66.67, 2);
      expect(result.industryDistribution[industryId2.toString()]).toBeCloseTo(66.67, 2);
    });

    it('should throw an error for non-existent user', async () => {
      const userId = new ObjectId();
      mockUserRepo.findById.mockResolvedValue(null);

      await expect(analyticsService.calculateNetworkAnalytics(userId)).rejects.toThrow(
        createValidationError(ErrorCode.USER_NOT_FOUND)
      );
    });
  });

  describe('getInviteAnalytics', () => {
    it('should retrieve and process invite analytics', async () => {
      const inviteId = new ObjectId();
      const invite = {
        _id: inviteId,
        userId: new ObjectId(),
        clickCount: 100,
        dailyClickData: { '2023-09-01': 50, '2023-09-02': 50 },
      };

      mockInviteRepo.findById.mockResolvedValue(invite);
      mockConnectionRepo.getConnectionsByInvite.mockResolvedValue([{}, {}, {}]); // 3 connections

      const result = await analyticsService.getInviteAnalytics(inviteId);

      expect(result.clickCount).toBe(100);
      expect(result.dailyClicks).toEqual({ '2023-09-01': 50, '2023-09-02': 50 });
      expect(result.conversionRate).toBeCloseTo(3, 2); // (3 / 100) * 100
    });

    it('should handle missing invite data', async () => {
      const inviteId = new ObjectId();
      mockInviteRepo.findById.mockResolvedValue(null);

      await expect(analyticsService.getInviteAnalytics(inviteId)).rejects.toThrow(
        createValidationError(ErrorCode.INVITE_NOT_FOUND)
      );
    });
  });

  // Additional tests for private methods can be added here if we decide to expose them for testing purposes
});

/**
 * This test suite covers the AnalyticsService, ensuring accurate calculation and processing
 * of network metrics, invite performance, and user engagement data.
 * 
 * Requirements addressed:
 * 1. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Tests network value calculation (3.14 per connection)
 * 2. Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 *    - Verifies invite performance tracking calculations
 * 3. Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 *    - Validates measurement of professional connections
 * 
 * Note: This test file uses Jest as the testing framework and includes mocks for the
 * required repositories to isolate the AnalyticsService for unit testing.
 */