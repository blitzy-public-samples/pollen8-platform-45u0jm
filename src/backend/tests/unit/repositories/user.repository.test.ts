import { ObjectId } from 'mongodb';
import { UserRepository } from '@backend/repositories/user.repository';
import { UserModel } from '@backend/models/user.model';
import { IUser, IUserCreate } from '@shared/interfaces/user.interface';
import { DuplicatePhoneError } from '@shared/errors/DuplicatePhoneError';

// Mock the UserModel
jest.mock('@backend/models/user.model');

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockUserModel: jest.Mocked<typeof UserModel>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Cast the mocked UserModel to the correct type
    mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
    
    // Create a new instance of UserRepository with the mocked UserModel
    userRepository = new UserRepository(mockUserModel);
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      // Prepare mock user data
      const mockUserCreate: IUserCreate = {
        phoneNumber: '+1234567890',
        industries: ['industry1', 'industry2'],
        interests: ['interest1', 'interest2'],
        location: { city: 'New York', zipCode: '10001' }
      };

      const mockCreatedUser: IUser = {
        _id: new ObjectId(),
        phoneNumber: mockUserCreate.phoneNumber,
        industries: mockUserCreate.industries.map(id => ({ _id: new ObjectId(id), name: `Industry ${id}` })),
        interests: mockUserCreate.interests.map(id => ({ _id: new ObjectId(id), name: `Interest ${id}` })),
        location: mockUserCreate.location,
        networkValue: 0,
        connectionCount: 0,
        role: 'user',
        createdAt: new Date(),
        lastActive: new Date()
      };

      // Mock successful user creation
      mockUserModel.create.mockResolvedValue(mockCreatedUser);

      // Call createUser method
      const result = await userRepository.createUser(mockUserCreate);

      // Verify user creation and returned data
      expect(mockUserModel.create).toHaveBeenCalledWith(mockUserCreate);
      expect(result).toEqual(mockCreatedUser);
    });

    it('should throw DuplicatePhoneError for duplicate phone numbers', async () => {
      // Prepare mock user data
      const mockUserCreate: IUserCreate = {
        phoneNumber: '+1234567890',
        industries: ['industry1'],
        interests: ['interest1'],
        location: { city: 'New York', zipCode: '10001' }
      };

      // Mock MongoDB duplicate key error
      const duplicateError = new Error('E11000 duplicate key error') as any;
      duplicateError.code = 11000;
      mockUserModel.create.mockRejectedValue(duplicateError);

      // Attempt to create user with duplicate phone
      await expect(userRepository.createUser(mockUserCreate)).rejects.toThrow(DuplicatePhoneError);
    });
  });

  describe('findUserByPhone', () => {
    it('should find a user by phone number', async () => {
      const mockPhone = '+1234567890';
      const mockUser: IUser = {
        _id: new ObjectId(),
        phoneNumber: mockPhone,
        industries: [{ _id: new ObjectId(), name: 'Industry 1' }],
        interests: [{ _id: new ObjectId(), name: 'Interest 1' }],
        location: { city: 'New York', zipCode: '10001' },
        networkValue: 3.14,
        connectionCount: 1,
        role: 'user',
        createdAt: new Date(),
        lastActive: new Date()
      };

      // Mock successful user lookup
      mockUserModel.findOne.mockResolvedValue(mockUser);

      // Call findUserByPhone method
      const result = await userRepository.findUserByPhone(mockPhone);

      // Verify returned user data
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ phoneNumber: mockPhone });
      expect(result).toEqual(mockUser);
    });

    it('should return null for non-existent phone number', async () => {
      const mockPhone = '+1987654321';

      // Mock empty result for phone lookup
      mockUserModel.findOne.mockResolvedValue(null);

      // Call findUserByPhone method
      const result = await userRepository.findUserByPhone(mockPhone);

      // Verify null is returned
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ phoneNumber: mockPhone });
      expect(result).toBeNull();
    });
  });

  // Additional tests for other UserRepository methods can be added here
  // For example: updateUser, deleteUser, findUserById, etc.

  // Test for network value calculation
  describe('updateNetworkValue', () => {
    it('should update the network value for a user', async () => {
      const userId = new ObjectId();
      const newNetworkValue = 15.7;

      mockUserModel.findByIdAndUpdate.mockResolvedValue({
        _id: userId,
        networkValue: newNetworkValue
      } as IUser);

      const result = await userRepository.updateNetworkValue(userId, newNetworkValue);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: { networkValue: newNetworkValue } },
        { new: true }
      );
      expect(result?.networkValue).toBe(newNetworkValue);
    });
  });

  // Test for updating user industries
  describe('updateUserIndustries', () => {
    it('should update the industries for a user', async () => {
      const userId = new ObjectId();
      const newIndustries = [
        { _id: new ObjectId(), name: 'Industry 1' },
        { _id: new ObjectId(), name: 'Industry 2' }
      ];

      mockUserModel.findByIdAndUpdate.mockResolvedValue({
        _id: userId,
        industries: newIndustries
      } as IUser);

      const result = await userRepository.updateUserIndustries(userId, newIndustries);

      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { $set: { industries: newIndustries } },
        { new: true }
      );
      expect(result?.industries).toEqual(newIndustries);
    });
  });
});