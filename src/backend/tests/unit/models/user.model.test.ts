import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { userModel, IUserModel } from '@models/user.model';
import { IUser } from '@shared/interfaces/user.interface';
import { setupTestDB } from '@tests/setup';

describe('User Model', () => {
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
    await setupTestDB();
  });

  const validUserData: Partial<IUser> = {
    phoneNumber: '+1234567890',
    industries: ['industry1', 'industry2', 'industry3'],
    interests: ['interest1', 'interest2', 'interest3'],
    location: {
      city: 'New York',
      zipCode: '10001'
    }
  };

  describe('User Model Validation', () => {
    it('should create a valid user', async () => {
      const user = await userModel.createUser(validUserData);
      expect(user).toBeDefined();
      expect(user.phoneNumber).toBe(validUserData.phoneNumber);
      expect(user.industries).toEqual(expect.arrayContaining(validUserData.industries!));
      expect(user.interests).toEqual(expect.arrayContaining(validUserData.interests!));
      expect(user.location.city).toBe(validUserData.location!.city);
      expect(user.location.zipCode).toBe(validUserData.location!.zipCode);
    });

    it('should require phone number', async () => {
      const invalidUser = { ...validUserData, phoneNumber: undefined };
      await expect(userModel.createUser(invalidUser)).rejects.toThrow();
    });

    it('should require unique phone number', async () => {
      await userModel.createUser(validUserData);
      await expect(userModel.createUser(validUserData)).rejects.toThrow();
    });

    it('should require minimum 3 industries', async () => {
      const invalidUser = { ...validUserData, industries: ['industry1', 'industry2'] };
      await expect(userModel.createUser(invalidUser)).rejects.toThrow();
    });

    it('should require minimum 3 interests', async () => {
      const invalidUser = { ...validUserData, interests: ['interest1', 'interest2'] };
      await expect(userModel.createUser(invalidUser)).rejects.toThrow();
    });

    it('should validate phone number format', async () => {
      const invalidUser = { ...validUserData, phoneNumber: '1234567890' };
      await expect(userModel.createUser(invalidUser)).rejects.toThrow();
    });
  });

  describe('Network Value Calculation', () => {
    it('should initialize network value to 0', async () => {
      const user = await userModel.createUser(validUserData);
      expect(user.networkValue).toBe(0);
    });

    it('should calculate network value correctly (3.14 per connection)', async () => {
      const user = await userModel.createUser(validUserData);
      await userModel.incrementConnectionCount(user._id);
      const updatedUser = await userModel.findUserById(user._id);
      expect(updatedUser?.networkValue).toBeCloseTo(3.14, 2);
    });

    it('should update network value when connections change', async () => {
      const user = await userModel.createUser(validUserData);
      await userModel.incrementConnectionCount(user._id);
      await userModel.incrementConnectionCount(user._id);
      const updatedUser = await userModel.findUserById(user._id);
      expect(updatedUser?.networkValue).toBeCloseTo(6.28, 2);
    });
  });

  describe('User Model Methods', () => {
    it('should update lastActive timestamp', async () => {
      const user = await userModel.createUser(validUserData);
      const initialLastActive = user.lastActive;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
      await userModel.updateLastActive(user._id);
      const updatedUser = await userModel.findUserById(user._id);
      expect(updatedUser?.lastActive).not.toEqual(initialLastActive);
    });

    it('should populate industries and interests', async () => {
      const user = await userModel.createUser(validUserData);
      const populatedUser = await userModel.getModel().findById(user._id)
        .populate('industries')
        .populate('interests')
        .exec();
      expect(populatedUser?.industries[0]).toHaveProperty('name');
      expect(populatedUser?.interests[0]).toHaveProperty('name');
    });

    it('should handle location updates', async () => {
      const user = await userModel.createUser(validUserData);
      const newLocation = { city: 'Los Angeles', zipCode: '90001' };
      await userModel.updateUser(user._id, { location: newLocation });
      const updatedUser = await userModel.findUserById(user._id);
      expect(updatedUser?.location.city).toBe(newLocation.city);
      expect(updatedUser?.location.zipCode).toBe(newLocation.zipCode);
    });
  });

  // Additional tests for error cases and edge scenarios
  describe('Error Handling', () => {
    it('should handle non-existent user ID gracefully', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const result = await userModel.findUserById(nonExistentId.toString());
      expect(result).toBeNull();
    });

    it('should handle invalid user data updates', async () => {
      const user = await userModel.createUser(validUserData);
      const invalidUpdate = { phoneNumber: 'invalid' };
      await expect(userModel.updateUser(user._id, invalidUpdate)).rejects.toThrow();
    });
  });

  // Performance considerations
  describe('Performance', () => {
    it('should handle bulk user creation efficiently', async () => {
      const bulkUsers = Array(100).fill(null).map((_, index) => ({
        ...validUserData,
        phoneNumber: `+1${String(index).padStart(10, '0')}`
      }));
      const startTime = Date.now();
      await Promise.all(bulkUsers.map(userData => userModel.createUser(userData)));
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Assuming less than 5 seconds for 100 users
    });
  });
});