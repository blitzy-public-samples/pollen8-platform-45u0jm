import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { InviteModel } from '@backend/models/invite.model';
import { IInvite } from '@shared/interfaces/invite.interface';
import { UserModel } from '@backend/models/user.model';

describe('Invite Model', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  const mockUserId = new mongoose.Types.ObjectId();
  const mockInviteData: Partial<IInvite> = {
    userId: mockUserId,
    name: 'Test Invite'
  };

  describe('Invite Model Validation', () => {
    it('should create a valid invite with required fields', async () => {
      const invite = new InviteModel(mockInviteData);
      const savedInvite = await invite.save();
      expect(savedInvite._id).toBeDefined();
      expect(savedInvite.userId).toEqual(mockUserId);
      expect(savedInvite.name).toBe('Test Invite');
    });

    it('should generate a unique code automatically', async () => {
      const invite = new InviteModel(mockInviteData);
      const savedInvite = await invite.save();
      expect(savedInvite.code).toBeDefined();
      expect(typeof savedInvite.code).toBe('string');
      expect(savedInvite.code.length).toBeGreaterThan(0);
    });

    it('should not allow duplicate codes', async () => {
      const invite1 = new InviteModel(mockInviteData);
      await invite1.save();

      const invite2 = new InviteModel(mockInviteData);
      invite2.code = invite1.code;

      await expect(invite2.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should enforce required fields', async () => {
      const invalidInvite = new InviteModel({ name: 'Invalid Invite' });
      await expect(invalidInvite.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should set default values correctly', async () => {
      const invite = new InviteModel(mockInviteData);
      const savedInvite = await invite.save();
      expect(savedInvite.clickCount).toBe(0);
      expect(savedInvite.dailyClickData).toEqual({});
      expect(savedInvite.isActive).toBe(true);
    });
  });

  describe('Invite Model Methods', () => {
    it('should generate a unique code', async () => {
      const invite = new InviteModel(mockInviteData);
      await invite.generateUniqueCode();
      expect(invite.code).toBeDefined();
      expect(typeof invite.code).toBe('string');
      expect(invite.code.length).toBeGreaterThan(0);
    });

    it('should update click count correctly', async () => {
      const invite = new InviteModel(mockInviteData);
      await invite.save();

      await invite.updateClickCount();
      expect(invite.clickCount).toBe(1);

      await invite.updateClickCount();
      expect(invite.clickCount).toBe(2);
    });

    it('should update daily click data', async () => {
      const invite = new InviteModel(mockInviteData);
      await invite.save();

      const today = new Date().toISOString().split('T')[0];
      await invite.updateDailyClickData();
      expect(invite.dailyClickData[today]).toBe(1);

      await invite.updateDailyClickData();
      expect(invite.dailyClickData[today]).toBe(2);
    });

    it('should handle concurrent click updates', async () => {
      const invite = new InviteModel(mockInviteData);
      await invite.save();

      const updatePromises = Array(10).fill(null).map(() => invite.updateClickCount());
      await Promise.all(updatePromises);

      const updatedInvite = await InviteModel.findById(invite._id);
      expect(updatedInvite?.clickCount).toBe(10);
    });
  });

  describe('Invite Model Queries', () => {
    it('should find invite by code', async () => {
      const invite = new InviteModel(mockInviteData);
      await invite.save();

      const foundInvite = await InviteModel.findByCode(invite.code);
      expect(foundInvite).toBeDefined();
      expect(foundInvite?.code).toBe(invite.code);
    });

    it('should find invites by user ID', async () => {
      const invite1 = new InviteModel(mockInviteData);
      const invite2 = new InviteModel(mockInviteData);
      await invite1.save();
      await invite2.save();

      const userInvites = await InviteModel.findByUserId(mockUserId);
      expect(userInvites.length).toBe(2);
      expect(userInvites[0].userId).toEqual(mockUserId);
      expect(userInvites[1].userId).toEqual(mockUserId);
    });

    it('should update invite properties', async () => {
      const invite = new InviteModel(mockInviteData);
      await invite.save();

      const updatedName = 'Updated Invite Name';
      await InviteModel.findByIdAndUpdate(invite._id, { name: updatedName });

      const updatedInvite = await InviteModel.findById(invite._id);
      expect(updatedInvite?.name).toBe(updatedName);
    });

    it('should soft delete an invite', async () => {
      const invite = new InviteModel(mockInviteData);
      await invite.save();

      await InviteModel.softDelete(invite._id);

      const softDeletedInvite = await InviteModel.findById(invite._id);
      expect(softDeletedInvite?.isActive).toBe(false);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid data', async () => {
      const invalidInvite = new InviteModel({ userId: 'invalid', name: 123 });
      await expect(invalidInvite.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should handle duplicate code error', async () => {
      const invite1 = new InviteModel(mockInviteData);
      await invite1.save();

      const invite2 = new InviteModel(mockInviteData);
      invite2.code = invite1.code;

      await expect(invite2.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should handle missing required fields', async () => {
      const incompleteInvite = new InviteModel({});
      await expect(incompleteInvite.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('should handle invalid references', async () => {
      const invalidUserId = new mongoose.Types.ObjectId();
      const invalidInvite = new InviteModel({ ...mockInviteData, userId: invalidUserId });
      await expect(invalidInvite.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });
});