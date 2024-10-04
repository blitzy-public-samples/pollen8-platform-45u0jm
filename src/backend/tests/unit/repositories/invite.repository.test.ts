import { InviteRepository } from '../../../src/repositories/invite.repository';
import { InviteModel, IInviteDocument } from '../../../src/models/invite.model';
import { CacheService } from '../../../src/services/cache.service';
import { IInvite, IInviteCreate } from '@shared/interfaces/invite.interface';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

describe('InviteRepository', () => {
  let inviteRepository: InviteRepository;
  let mockCacheService: jest.Mocked<CacheService>;

  const sampleInvite: IInvite = {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    name: 'Test Invite',
    code: 'TEST123',
    clickCount: 0,
    dailyClickData: {},
    createdAt: new Date(),
    isActive: true
  };

  beforeEach(() => {
    jest.resetAllMocks();
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn()
    } as unknown as jest.Mocked<CacheService>;
    inviteRepository = new InviteRepository(mockCacheService);

    // Setup mock implementations for InviteModel
    jest.spyOn(InviteModel, 'findOne').mockResolvedValue(sampleInvite as IInviteDocument);
    jest.spyOn(InviteModel, 'find').mockResolvedValue([sampleInvite] as IInviteDocument[]);
    jest.spyOn(InviteModel.prototype, 'save').mockResolvedValue(sampleInvite as IInviteDocument);
    jest.spyOn(InviteModel, 'findOneAndUpdate').mockResolvedValue(sampleInvite as IInviteDocument);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#createInvite', () => {
    it('should create a new invite successfully', async () => {
      const inviteData: IInviteCreate = {
        userId: sampleInvite.userId,
        name: sampleInvite.name,
        code: sampleInvite.code
      };

      const result = await inviteRepository.createInvite(inviteData);

      expect(result).toEqual(sampleInvite);
      expect(InviteModel.prototype.save).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalledWith(`user:${sampleInvite.userId}:invites`);
    });

    it('should handle duplicate code generation', async () => {
      jest.spyOn(InviteModel.prototype, 'save').mockRejectedValueOnce(new Error('Duplicate key error'));
      jest.spyOn(InviteModel.prototype, 'save').mockResolvedValueOnce(sampleInvite as IInviteDocument);

      const inviteData: IInviteCreate = {
        userId: sampleInvite.userId,
        name: sampleInvite.name,
        code: sampleInvite.code
      };

      await expect(inviteRepository.createInvite(inviteData)).resolves.toEqual(sampleInvite);
      expect(InviteModel.prototype.save).toHaveBeenCalledTimes(2);
    });

    it('should throw an error on database failure', async () => {
      jest.spyOn(InviteModel.prototype, 'save').mockRejectedValue(new Error('Database error'));

      const inviteData: IInviteCreate = {
        userId: sampleInvite.userId,
        name: sampleInvite.name,
        code: sampleInvite.code
      };

      await expect(inviteRepository.createInvite(inviteData)).rejects.toThrow('Database error');
    });
  });

  describe('#getInviteByCode', () => {
    it('should retrieve invite from cache when available', async () => {
      mockCacheService.get.mockResolvedValue(sampleInvite);

      const result = await inviteRepository.getInviteByCode(sampleInvite.code);

      expect(result).toEqual(sampleInvite);
      expect(mockCacheService.get).toHaveBeenCalledWith(`invite:${sampleInvite.code}`);
      expect(InviteModel.findOne).not.toHaveBeenCalled();
    });

    it('should retrieve invite from database when not in cache', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const result = await inviteRepository.getInviteByCode(sampleInvite.code);

      expect(result).toEqual(sampleInvite);
      expect(mockCacheService.get).toHaveBeenCalledWith(`invite:${sampleInvite.code}`);
      expect(InviteModel.findOne).toHaveBeenCalledWith({ code: sampleInvite.code });
      expect(mockCacheService.set).toHaveBeenCalledWith(`invite:${sampleInvite.code}`, sampleInvite, 3600);
    });

    it('should return null for non-existent invite', async () => {
      mockCacheService.get.mockResolvedValue(null);
      jest.spyOn(InviteModel, 'findOne').mockResolvedValue(null);

      const result = await inviteRepository.getInviteByCode('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('#updateInviteClickCount', () => {
    it('should increment click count and update daily data', async () => {
      const mockUpdateClickCount = jest.fn();
      jest.spyOn(InviteModel, 'findOne').mockResolvedValue({
        ...sampleInvite,
        updateClickCount: mockUpdateClickCount
      } as unknown as IInviteDocument);

      await inviteRepository.updateInviteClickCount(sampleInvite.code);

      expect(mockUpdateClickCount).toHaveBeenCalled();
      expect(mockCacheService.del).toHaveBeenCalledWith(`invite:${sampleInvite.code}`);
      expect(mockCacheService.del).toHaveBeenCalledWith(`user:${sampleInvite.userId}:invites`);
    });

    it('should throw an error for non-existent invite', async () => {
      jest.spyOn(InviteModel, 'findOne').mockResolvedValue(null);

      await expect(inviteRepository.updateInviteClickCount('NONEXISTENT')).rejects.toThrow('Invite not found');
    });
  });

  describe('#getUserInvites', () => {
    it('should retrieve all invites for a user', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const result = await inviteRepository.getUserInvites(sampleInvite.userId.toString());

      expect(result).toEqual([sampleInvite]);
      expect(InviteModel.find).toHaveBeenCalledWith({ userId: sampleInvite.userId });
      expect(mockCacheService.set).toHaveBeenCalledWith(`user:${sampleInvite.userId}:invites`, [sampleInvite], 1800);
    });

    it('should return cached results when available', async () => {
      mockCacheService.get.mockResolvedValue([sampleInvite]);

      const result = await inviteRepository.getUserInvites(sampleInvite.userId.toString());

      expect(result).toEqual([sampleInvite]);
      expect(InviteModel.find).not.toHaveBeenCalled();
    });

    it('should return an empty array for user with no invites', async () => {
      mockCacheService.get.mockResolvedValue(null);
      jest.spyOn(InviteModel, 'find').mockResolvedValue([]);

      const result = await inviteRepository.getUserInvites('nonexistentUserId');

      expect(result).toEqual([]);
    });
  });

  describe('#updateInvite', () => {
    it('should successfully update invite properties', async () => {
      const updateData = { name: 'Updated Invite Name' };

      const result = await inviteRepository.updateInvite(sampleInvite.code, updateData);

      expect(result).toEqual(sampleInvite);
      expect(InviteModel.findOneAndUpdate).toHaveBeenCalledWith({ code: sampleInvite.code }, updateData, { new: true });
      expect(mockCacheService.del).toHaveBeenCalledWith(`invite:${sampleInvite.code}`);
      expect(mockCacheService.del).toHaveBeenCalledWith(`user:${sampleInvite.userId}:invites`);
    });

    it('should return null for non-existent invite', async () => {
      jest.spyOn(InviteModel, 'findOneAndUpdate').mockResolvedValue(null);

      const result = await inviteRepository.updateInvite('NONEXISTENT', { name: 'Test' });

      expect(result).toBeNull();
      expect(mockCacheService.del).not.toHaveBeenCalled();
    });
  });

  describe('#getInviteAnalytics', () => {
    it('should correctly aggregate analytics data', async () => {
      mockCacheService.get.mockResolvedValue(null);
      const mockInvite = {
        ...sampleInvite,
        clickCount: 100,
        dailyClickData: { '2023-09-01': 50, '2023-09-02': 50 },
        createdAt: new Date('2023-09-01')
      };
      jest.spyOn(InviteModel, 'findOne').mockResolvedValue(mockInvite as IInviteDocument);

      const result = await inviteRepository.getInviteAnalytics(sampleInvite.code);

      expect(result).toEqual({
        totalClicks: 100,
        dailyClicks: { '2023-09-01': 50, '2023-09-02': 50 },
        averageClicksPerDay: 50 // Assuming 2 days since creation
      });
      expect(mockCacheService.set).toHaveBeenCalledWith(`invite:${sampleInvite.code}:analytics`, expect.any(Object), 3600);
    });

    it('should use cached analytics when available', async () => {
      const cachedAnalytics = {
        totalClicks: 100,
        dailyClicks: { '2023-09-01': 50, '2023-09-02': 50 },
        averageClicksPerDay: 50
      };
      mockCacheService.get.mockResolvedValue(cachedAnalytics);

      const result = await inviteRepository.getInviteAnalytics(sampleInvite.code);

      expect(result).toEqual(cachedAnalytics);
      expect(InviteModel.findOne).not.toHaveBeenCalled();
    });

    it('should throw an error for non-existent invite', async () => {
      mockCacheService.get.mockResolvedValue(null);
      jest.spyOn(InviteModel, 'findOne').mockResolvedValue(null);

      await expect(inviteRepository.getInviteAnalytics('NONEXISTENT')).rejects.toThrow('Invite not found');
    });
  });
});