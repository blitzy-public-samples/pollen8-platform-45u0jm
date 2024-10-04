import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { UserRepository } from '../repositories/user.repository';
import { ConnectionRepository } from '../repositories/connection.repository';
import { InviteRepository } from '../repositories/invite.repository';
import { IUser } from '../../shared/interfaces/user.interface';
import { IConnection } from '../../shared/interfaces/connection.interface';
import { IInvite } from '../../shared/interfaces/invite.interface';
import { CacheStrategyManager } from '../cache/strategies';
import { Logger } from '../utils/logger';

/**
 * Comprehensive test suite for all repository implementations in the Pollen8 platform.
 * This suite ensures correct data access operations and adherence to the repository interface contract.
 * 
 * Requirements addressed:
 * - Data Access Testing (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 * - Type Safety (Technical Specification/2.1 Programming Languages)
 * - Quality Assurance (Technical Specification/8.1.2 Performance Benchmarks)
 */

describe('Repository Tests', () => {
  let mongoServer: MongoMemoryServer;
  let userRepository: UserRepository;
  let connectionRepository: ConnectionRepository;
  let inviteRepository: InviteRepository;
  let cacheManager: CacheStrategyManager;
  let logger: Logger;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    cacheManager = new CacheStrategyManager();
    logger = new Logger();

    userRepository = new UserRepository();
    connectionRepository = new ConnectionRepository(cacheManager, logger);
    inviteRepository = new InviteRepository(cacheManager);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('UserRepository', () => {
    let testUser: IUser;

    beforeEach(async () => {
      testUser = await userRepository.create({
        phoneNumber: '+1234567890',
        industries: ['industry1', 'industry2'],
        interests: ['interest1', 'interest2'],
        location: { city: 'Test City', zipCode: '12345' },
      });
    });

    afterEach(async () => {
      await userRepository.delete({ _id: testUser._id });
    });

    it('should create a new user', async () => {
      expect(testUser).toBeDefined();
      expect(testUser.phoneNumber).toBe('+1234567890');
      expect(testUser.industries).toHaveLength(2);
      expect(testUser.interests).toHaveLength(2);
      expect(testUser.location.city).toBe('Test City');
    });

    it('should find user by phone number', async () => {
      const foundUser = await userRepository.findOne({ phoneNumber: '+1234567890' });
      expect(foundUser).toBeDefined();
      expect(foundUser?._id).toEqual(testUser._id);
    });

    it('should update user network value', async () => {
      const updatedUser = await userRepository.updateNetworkValue(testUser._id.toString());
      expect(updatedUser.networkValue).toBe(3.14); // 1 connection * 3.14
    });

    it('should find users by industries', async () => {
      const users = await userRepository.findByIndustries(['industry1']);
      expect(users).toHaveLength(1);
      expect(users[0]._id).toEqual(testUser._id);
    });
  });

  describe('ConnectionRepository', () => {
    let testUser1: IUser;
    let testUser2: IUser;
    let testConnection: IConnection;

    beforeEach(async () => {
      testUser1 = await userRepository.create({
        phoneNumber: '+1111111111',
        industries: ['industry1'],
      });
      testUser2 = await userRepository.create({
        phoneNumber: '+2222222222',
        industries: ['industry2'],
      });
      testConnection = await connectionRepository.create({
        userId: testUser1._id,
        connectedUserId: testUser2._id,
        status: 'PENDING',
        sharedIndustries: [],
      });
    });

    afterEach(async () => {
      await connectionRepository.delete({ _id: testConnection._id });
      await userRepository.delete({ _id: testUser1._id });
      await userRepository.delete({ _id: testUser2._id });
    });

    it('should create a connection between users', async () => {
      expect(testConnection).toBeDefined();
      expect(testConnection.userId).toEqual(testUser1._id);
      expect(testConnection.connectedUserId).toEqual(testUser2._id);
    });

    it('should find connections by user', async () => {
      const connections = await connectionRepository.findByUser(testUser1._id.toString());
      expect(connections).toHaveLength(1);
      expect(connections[0]._id).toEqual(testConnection._id);
    });

    it('should find connections by industry', async () => {
      await connectionRepository.update(
        { _id: testConnection._id },
        { sharedIndustries: ['industry1'] }
      );
      const connections = await connectionRepository.findByIndustry('industry1');
      expect(connections).toHaveLength(1);
      expect(connections[0]._id).toEqual(testConnection._id);
    });
  });

  describe('InviteRepository', () => {
    let testUser: IUser;
    let testInvite: IInvite;

    beforeEach(async () => {
      testUser = await userRepository.create({
        phoneNumber: '+3333333333',
      });
      testInvite = await inviteRepository.create({
        userId: testUser._id,
        name: 'Test Invite',
      });
    });

    afterEach(async () => {
      await inviteRepository.delete({ _id: testInvite._id });
      await userRepository.delete({ _id: testUser._id });
    });

    it('should create an invite', async () => {
      expect(testInvite).toBeDefined();
      expect(testInvite.userId).toEqual(testUser._id);
      expect(testInvite.name).toBe('Test Invite');
      expect(testInvite.code).toBeDefined();
    });

    it('should increment invite click count', async () => {
      await inviteRepository.incrementClickCount(testInvite.code);
      const updatedInvite = await inviteRepository.findOne({ _id: testInvite._id });
      expect(updatedInvite?.clickCount).toBe(1);
    });

    it('should get invite analytics', async () => {
      await inviteRepository.incrementClickCount(testInvite.code);
      const analytics = await inviteRepository.getAnalytics(testUser._id.toString());
      expect(analytics.totalInvites).toBe(1);
      expect(analytics.totalClicks).toBe(1);
      expect(Object.keys(analytics.dailyClicks)).toHaveLength(1);
    });
  });
});

/**
 * @fileoverview This test suite covers the core functionality of the UserRepository, ConnectionRepository,
 * and InviteRepository classes. It ensures that all repository implementations adhere to their
 * interface contracts and correctly handle data access operations.
 * 
 * Key aspects tested:
 * 1. User creation, retrieval, and network value calculation
 * 2. Connection creation and industry-based querying
 * 3. Invite creation, click tracking, and analytics retrieval
 * 
 * The suite uses an in-memory MongoDB instance to isolate tests and ensure consistent results.
 * Each test case is designed to validate a specific requirement from the technical specification,
 * ensuring that the data access layer meets the project's needs for verified connections,
 * industry focus, and quantifiable networking.
 */