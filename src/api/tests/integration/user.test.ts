import request from 'supertest';
import { expect, describe, it, beforeEach, jest } from 'jest';
import { app } from '../src/app';
import { UserService } from '../src/services/user.service';
import { IUser, IUserCreate, IUserUpdate } from '@shared/interfaces/user.interface';
import { ConnectionStatus } from '@shared/enums/connectionStatus.enum';

// Mock UserService
jest.mock('../src/services/user.service');

describe('User API Integration Tests', () => {
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
    mockUserService = UserService as jest.Mocked<UserService>;
  });

  const validUserData: IUserCreate = {
    phoneNumber: '+1234567890',
    industries: ['tech', 'finance', 'education'],
    interests: ['AI', 'blockchain', 'edtech'],
    location: {
      city: 'New York',
      zipCode: '10001'
    }
  };

  const authToken = 'valid-jwt-token';

  describe('User Creation', () => {
    it('Should create a new user with valid data', async () => {
      const mockUser: IUser = {
        _id: 'mockId',
        ...validUserData,
        networkValue: 0,
        connectionCount: 0,
        role: 'user',
        createdAt: new Date(),
        lastActive: new Date()
      };

      mockUserService.createUser.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/users')
        .send(validUserData)
        .expect(201);

      expect(response.body.user).toMatchObject(mockUser);
      expect(mockUserService.createUser).toHaveBeenCalledWith(validUserData);
    });

    it('Should return 400 for missing required fields', async () => {
      const invalidData = { ...validUserData, phoneNumber: undefined };

      await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(400);
    });

    it('Should return 400 for less than 3 industries', async () => {
      const invalidData = { ...validUserData, industries: ['tech', 'finance'] };

      await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(400);
    });

    it('Should return 400 for less than 3 interests', async () => {
      const invalidData = { ...validUserData, interests: ['AI', 'blockchain'] };

      await request(app)
        .post('/api/users')
        .send(invalidData)
        .expect(400);
    });

    it('Should return 409 for duplicate phone number', async () => {
      mockUserService.createUser.mockRejectedValue(new Error('Phone number already exists'));

      await request(app)
        .post('/api/users')
        .send(validUserData)
        .expect(409);
    });
  });

  describe('User Update', () => {
    const updateData: IUserUpdate = {
      industries: ['tech', 'finance', 'healthcare'],
      interests: ['AI', 'blockchain', 'healthtech'],
      location: {
        city: 'San Francisco',
        zipCode: '94105'
      }
    };

    it('Should update user with valid data', async () => {
      const mockUpdatedUser: IUser = {
        _id: 'mockId',
        ...validUserData,
        ...updateData,
        networkValue: 10,
        connectionCount: 3,
        role: 'user',
        createdAt: new Date(),
        lastActive: new Date()
      };

      mockUserService.updateUser.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user).toMatchObject(mockUpdatedUser);
      expect(mockUserService.updateUser).toHaveBeenCalledWith(expect.any(String), updateData);
    });

    it('Should return 401 for unauthenticated request', async () => {
      await request(app)
        .put('/api/users')
        .send(updateData)
        .expect(401);
    });

    it('Should return 400 for invalid industry count', async () => {
      const invalidData = { ...updateData, industries: ['tech', 'finance'] };

      await request(app)
        .put('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('Should return 400 for invalid interest count', async () => {
      const invalidData = { ...updateData, interests: ['AI', 'blockchain'] };

      await request(app)
        .put('/api/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('User Profile Retrieval', () => {
    it('Should return user profile for authenticated request', async () => {
      const mockUser: IUser = {
        _id: 'mockId',
        ...validUserData,
        networkValue: 15.7,
        connectionCount: 5,
        role: 'user',
        createdAt: new Date(),
        lastActive: new Date()
      };

      mockUserService.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toMatchObject(mockUser);
    });

    it('Should return 401 for unauthenticated request', async () => {
      await request(app)
        .get('/api/users/profile')
        .expect(401);
    });
  });

  describe('Network Value Calculation', () => {
    it('Should return correct network value', async () => {
      const mockNetworkValue = 15.7;
      mockUserService.calculateNetworkValue.mockResolvedValue(mockNetworkValue);

      const response = await request(app)
        .get('/api/users/network-value')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.networkValue).toBe(mockNetworkValue);
    });

    it('Should return 401 for unauthenticated request', async () => {
      await request(app)
        .get('/api/users/network-value')
        .expect(401);
    });
  });
});