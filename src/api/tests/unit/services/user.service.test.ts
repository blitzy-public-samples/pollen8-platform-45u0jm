import { UserService } from '@api/services/user.service';
import { UserRepository } from '@database/repositories/user.repository';
import { IUser, IUserCreate, IUserUpdate } from '@shared/interfaces/user.interface';
import { NETWORK_VALUE_PER_CONNECTION } from '@shared/constants/networkValue';
import { MockProxy, mock } from 'jest-mock-extended';
import { ObjectId } from 'mongodb';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: MockProxy<UserRepository>;

  const mockUser: IUser = {
    _id: new ObjectId('mockId'),
    phoneNumber: '+1234567890',
    industries: ['ind1', 'ind2', 'ind3'],
    interests: ['int1', 'int2', 'int3'],
    location: { city: 'New York', zipCode: '10001' },
    networkValue: 0,
    connectionCount: 0,
    role: 'user',
    createdAt: new Date(),
    lastActive: new Date()
  };

  const mockUserCreate: IUserCreate = {
    phoneNumber: '+1234567890',
    industries: ['ind1', 'ind2', 'ind3'],
    interests: ['int1', 'int2', 'int3'],
    location: { city: 'New York', zipCode: '10001' }
  };

  beforeEach(() => {
    mockUserRepository = mock<UserRepository>();
    userService = new UserService(mockUserRepository);
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      mockUserRepository.findByPhoneNumber.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await userService.createUser(mockUserCreate);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith(expect.objectContaining(mockUserCreate));
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser._id.toString(), { networkValue: 0 });
    });

    it('should throw an error when phone number already exists', async () => {
      mockUserRepository.findByPhoneNumber.mockResolvedValue(mockUser);

      await expect(userService.createUser(mockUserCreate)).rejects.toThrow('Phone number already in use');
    });

    it('should throw an error when less than 3 industries are provided', async () => {
      const invalidUserCreate = { ...mockUserCreate, industries: ['ind1', 'ind2'] };

      await expect(userService.createUser(invalidUserCreate)).rejects.toThrow('At least 3 industries must be selected');
    });

    it('should throw an error when less than 3 interests are provided', async () => {
      const invalidUserCreate = { ...mockUserCreate, interests: ['int1', 'int2'] };

      await expect(userService.createUser(invalidUserCreate)).rejects.toThrow('At least 3 interests must be selected');
    });
  });

  describe('updateUser', () => {
    const mockUserUpdate: IUserUpdate = {
      industries: ['ind1', 'ind2', 'ind3', 'ind4'],
      interests: ['int1', 'int2', 'int3', 'int4'],
      location: { city: 'Los Angeles', zipCode: '90001' }
    };

    it('should update a user successfully', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue({ ...mockUser, ...mockUserUpdate });

      const result = await userService.updateUser(mockUser._id.toString(), mockUserUpdate);

      expect(result).toEqual({ ...mockUser, ...mockUserUpdate });
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser._id.toString(), mockUserUpdate);
    });

    it('should throw an error when user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.updateUser('nonexistentId', mockUserUpdate)).rejects.toThrow('User not found');
    });

    it('should throw an error when updating with less than 3 industries', async () => {
      const invalidUpdate = { ...mockUserUpdate, industries: ['ind1', 'ind2'] };

      await expect(userService.updateUser(mockUser._id.toString(), invalidUpdate)).rejects.toThrow('At least 3 industries must be selected');
    });

    it('should throw an error when updating with less than 3 interests', async () => {
      const invalidUpdate = { ...mockUserUpdate, interests: ['int1', 'int2'] };

      await expect(userService.updateUser(mockUser._id.toString(), invalidUpdate)).rejects.toThrow('At least 3 interests must be selected');
    });
  });

  describe('getUserById', () => {
    it('should retrieve a user by ID successfully', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(mockUser._id.toString());

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser._id.toString());
    });

    it('should throw an error when user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById('nonexistentId')).rejects.toThrow('User not found');
    });

    it('should throw an error for invalid user ID', async () => {
      await expect(userService.getUserById('invalidId')).rejects.toThrow('Invalid user ID');
    });
  });

  describe('getUserByPhoneNumber', () => {
    it('should retrieve a user by phone number successfully', async () => {
      mockUserRepository.findByPhoneNumber.mockResolvedValue(mockUser);

      const result = await userService.getUserByPhoneNumber(mockUser.phoneNumber);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findByPhoneNumber).toHaveBeenCalledWith(mockUser.phoneNumber);
    });

    it('should return null when user is not found', async () => {
      mockUserRepository.findByPhoneNumber.mockResolvedValue(null);

      const result = await userService.getUserByPhoneNumber('+9876543210');

      expect(result).toBeNull();
    });

    it('should throw an error for invalid phone number format', async () => {
      await expect(userService.getUserByPhoneNumber('invalid-number')).rejects.toThrow('Invalid phone number format');
    });
  });

  describe('calculateNetworkValue', () => {
    it('should calculate network value correctly', async () => {
      const userWithConnections = { ...mockUser, connectionCount: 5 };
      mockUserRepository.findById.mockResolvedValue(userWithConnections);
      mockUserRepository.update.mockResolvedValue(userWithConnections);

      const result = await userService.calculateNetworkValue(userWithConnections._id.toString());

      const expectedNetworkValue = userWithConnections.connectionCount * NETWORK_VALUE_PER_CONNECTION;
      expect(result).toBe(expectedNetworkValue);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userWithConnections._id.toString(), { networkValue: expectedNetworkValue });
    });

    it('should throw an error when user is not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.calculateNetworkValue('nonexistentId')).rejects.toThrow('User not found');
    });

    it('should return zero for user with no connections', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(mockUser);

      const result = await userService.calculateNetworkValue(mockUser._id.toString());

      expect(result).toBe(0);
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUser._id.toString(), { networkValue: 0 });
    });
  });
});