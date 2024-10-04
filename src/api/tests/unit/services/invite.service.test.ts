import { ObjectId } from 'mongodb';
import { InviteService } from '@services/invite.service';
import { InviteRepository } from '@database/repositories/invite.repository';
import { CacheService } from '@services/cache.service';
import { WebSocketService } from '@services/websocket.service';
import { IInvite, IInviteCreate, IInviteUpdate } from '@shared/interfaces/invite.interface';
import { validateInviteCreate, validateInviteUpdate } from '@shared/validators/invite.validator';
import { ApiError } from '@utils/ApiError';
import { NETWORK_VALUE_PER_CONNECTION } from '@shared/constants/networkValue';

// Mock dependencies
jest.mock('@database/repositories/invite.repository');
jest.mock('@services/cache.service');
jest.mock('@services/websocket.service');
jest.mock('@shared/validators/invite.validator');

describe('InviteService', () => {
  let inviteService: InviteService;
  let mockInviteRepository: jest.Mocked<InviteRepository>;
  let mockCacheService: jest.Mocked<CacheService>;
  let mockWebSocketService: jest.Mocked<WebSocketService>;

  beforeEach(() => {
    mockInviteRepository = new InviteRepository() as jest.Mocked<InviteRepository>;
    mockCacheService = new CacheService() as jest.Mocked<CacheService>;
    mockWebSocketService = new WebSocketService() as jest.Mocked<WebSocketService>;

    inviteService = new InviteService(
      mockInviteRepository,
      mockCacheService,
      mockWebSocketService
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createInvite', () => {
    const userId = new ObjectId();
    const inviteName = 'Test Invite';
    const mockInvite: IInvite = {
      _id: new ObjectId(),
      userId,
      name: inviteName,
      code: 'testcode',
      clickCount: 0,
      dailyClickData: {},
      createdAt: new Date(),
      isActive: true
    };

    it('should create a new invite successfully', async () => {
      (validateInviteCreate as jest.Mock).mockReturnValue({ isValid: true });
      mockInviteRepository.create.mockResolvedValue(mockInvite);

      const result = await inviteService.createInvite(userId, inviteName);

      expect(validateInviteCreate).toHaveBeenCalledWith({ userId, name: inviteName });
      expect(mockInviteRepository.create).toHaveBeenCalled();
      expect(mockCacheService.setInvite).toHaveBeenCalledWith(mockInvite.code, mockInvite);
      expect(result.invite).toEqual(mockInvite);
    });

    it('should throw error when validation fails', async () => {
      (validateInviteCreate as jest.Mock).mockReturnValue({ isValid: false, errors: ['Invalid name'] });

      await expect(inviteService.createInvite(userId, inviteName)).rejects.toThrow(ApiError);
      expect(mockInviteRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getInviteAnalytics', () => {
    const inviteId = new ObjectId();
    const mockInvite: IInvite = {
      _id: inviteId,
      userId: new ObjectId(),
      name: 'Test Invite',
      code: 'testcode',
      clickCount: 10,
      dailyClickData: { '2023-09-01': 5, '2023-09-02': 5 },
      createdAt: new Date(),
      isActive: true
    };

    it('should retrieve analytics for valid invite', async () => {
      mockCacheService.getInviteAnalytics.mockResolvedValue(null);
      mockInviteRepository.findById.mockResolvedValue(mockInvite);

      const result = await inviteService.getInviteAnalytics(inviteId);

      expect(mockCacheService.getInviteAnalytics).toHaveBeenCalledWith(inviteId);
      expect(mockInviteRepository.findById).toHaveBeenCalledWith(inviteId);
      expect(mockCacheService.setInviteAnalytics).toHaveBeenCalled();
      expect(result.invite).toEqual(mockInvite);
      expect(result.analytics).toBeDefined();
      expect(result.analytics.totalClicks).toBe(10);
      expect(result.analytics.dailyTrend).toHaveLength(2);
    });

    it('should return cached analytics if available', async () => {
      const cachedAnalytics = { invite: mockInvite, analytics: { totalClicks: 10, dailyTrend: [] } };
      mockCacheService.getInviteAnalytics.mockResolvedValue(cachedAnalytics);

      const result = await inviteService.getInviteAnalytics(inviteId);

      expect(mockCacheService.getInviteAnalytics).toHaveBeenCalledWith(inviteId);
      expect(mockInviteRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(cachedAnalytics);
    });

    it('should throw error for non-existent invite', async () => {
      mockCacheService.getInviteAnalytics.mockResolvedValue(null);
      mockInviteRepository.findById.mockResolvedValue(null);

      await expect(inviteService.getInviteAnalytics(inviteId)).rejects.toThrow(ApiError);
    });
  });

  describe('trackInviteClick', () => {
    const inviteCode = 'testcode';
    const mockInvite: IInvite = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      name: 'Test Invite',
      code: inviteCode,
      clickCount: 5,
      dailyClickData: {},
      createdAt: new Date(),
      isActive: true
    };

    it('should increment click count successfully', async () => {
      (validateInviteCode as jest.Mock).mockReturnValue({ isValid: true });
      mockInviteRepository.incrementClickCount.mockResolvedValue(mockInvite);

      await inviteService.trackInviteClick(inviteCode);

      expect(validateInviteCode).toHaveBeenCalledWith(inviteCode);
      expect(mockInviteRepository.incrementClickCount).toHaveBeenCalledWith(inviteCode);
      expect(mockInviteRepository.incrementDailyClickCount).toHaveBeenCalled();
      expect(mockCacheService.invalidateInviteAnalytics).toHaveBeenCalledWith(mockInvite._id);
      expect(mockWebSocketService.emitInviteUpdate).toHaveBeenCalled();
    });

    it('should throw error for invalid invite code', async () => {
      (validateInviteCode as jest.Mock).mockReturnValue({ isValid: false, errors: ['Invalid code'] });

      await expect(inviteService.trackInviteClick(inviteCode)).rejects.toThrow(ApiError);
      expect(mockInviteRepository.incrementClickCount).not.toHaveBeenCalled();
    });

    it('should throw error for non-existent invite', async () => {
      (validateInviteCode as jest.Mock).mockReturnValue({ isValid: true });
      mockInviteRepository.incrementClickCount.mockResolvedValue(null);

      await expect(inviteService.trackInviteClick(inviteCode)).rejects.toThrow(ApiError);
    });
  });

  describe('updateInvite', () => {
    const inviteId = new ObjectId();
    const updateData: IInviteUpdate = { name: 'Updated Invite' };
    const mockUpdatedInvite: IInvite = {
      _id: inviteId,
      userId: new ObjectId(),
      name: 'Updated Invite',
      code: 'testcode',
      clickCount: 0,
      dailyClickData: {},
      createdAt: new Date(),
      isActive: true
    };

    it('should update invite successfully', async () => {
      (validateInviteUpdate as jest.Mock).mockReturnValue({ isValid: true });
      mockInviteRepository.update.mockResolvedValue(mockUpdatedInvite);

      const result = await inviteService.updateInvite(inviteId, updateData);

      expect(validateInviteUpdate).toHaveBeenCalledWith(updateData);
      expect(mockInviteRepository.update).toHaveBeenCalledWith(inviteId, updateData);
      expect(mockCacheService.invalidateInvite).toHaveBeenCalledWith(mockUpdatedInvite.code);
      expect(mockCacheService.setInvite).toHaveBeenCalledWith(mockUpdatedInvite.code, mockUpdatedInvite);
      expect(result.invite).toEqual(mockUpdatedInvite);
    });

    it('should throw error when validation fails', async () => {
      (validateInviteUpdate as jest.Mock).mockReturnValue({ isValid: false, errors: ['Invalid update'] });

      await expect(inviteService.updateInvite(inviteId, updateData)).rejects.toThrow(ApiError);
      expect(mockInviteRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error for non-existent invite', async () => {
      (validateInviteUpdate as jest.Mock).mockReturnValue({ isValid: true });
      mockInviteRepository.update.mockResolvedValue(null);

      await expect(inviteService.updateInvite(inviteId, updateData)).rejects.toThrow(ApiError);
    });
  });

  describe('deactivateInvite', () => {
    const inviteId = new ObjectId();
    const mockDeactivatedInvite: IInvite = {
      _id: inviteId,
      userId: new ObjectId(),
      name: 'Test Invite',
      code: 'testcode',
      clickCount: 0,
      dailyClickData: {},
      createdAt: new Date(),
      isActive: false
    };

    it('should deactivate invite successfully', async () => {
      mockInviteRepository.update.mockResolvedValue(mockDeactivatedInvite);

      const result = await inviteService.deactivateInvite(inviteId);

      expect(mockInviteRepository.update).toHaveBeenCalledWith(inviteId, { isActive: false });
      expect(mockCacheService.invalidateInvite).toHaveBeenCalledWith(mockDeactivatedInvite.code);
      expect(mockCacheService.setInvite).toHaveBeenCalledWith(mockDeactivatedInvite.code, mockDeactivatedInvite);
      expect(result.invite).toEqual(mockDeactivatedInvite);
    });

    it('should throw error for non-existent invite', async () => {
      mockInviteRepository.update.mockResolvedValue(null);

      await expect(inviteService.deactivateInvite(inviteId)).rejects.toThrow(ApiError);
    });
  });
});