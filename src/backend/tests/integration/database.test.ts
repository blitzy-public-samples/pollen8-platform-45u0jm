import { MongoMemoryServer } from 'mongodb-memory-server';
import { createConnection, getConnection, mongoose } from '../../src/config/database';
import { createRedisConfig, REDIS_CONFIG } from '../../src/config/redis';
import { UserRepository } from '../../src/repositories/user.repository';
import { ConnectionRepository } from '../../src/repositories/connection.repository';
import { UserModel } from '../../src/models/user.model';
import { ConnectionModel } from '../../src/models/connection.model';
import Redis from 'ioredis-mock';
import { User } from '../../../shared/interfaces/user.interface';
import { Connection } from '../../../shared/interfaces/connection.interface';

describe('Database Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let redisClient: Redis;
  let userRepository: UserRepository;
  let connectionRepository: ConnectionRepository;

  beforeAll(async () => {
    // Set up MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;

    // Connect to the in-memory database
    await createConnection();

    // Set up Redis mock
    redisClient = new Redis(REDIS_CONFIG);

    // Initialize repositories
    userRepository = new UserRepository(UserModel, redisClient);
    connectionRepository = new ConnectionRepository(ConnectionModel, redisClient);
  });

  afterAll(async () => {
    // Close the database connection
    await mongoose.connection.close();
    // Stop the MongoDB Memory Server
    await mongoServer.stop();
    // Close Redis connection
    await redisClient.quit();
  });

  beforeEach(async () => {
    // Clear the database before each test
    await UserModel.deleteMany({});
    await ConnectionModel.deleteMany({});
    // Clear Redis cache
    await redisClient.flushall();
  });

  describe('User Operations', () => {
    it('should create a new user', async () => {
      const userData: Partial<User> = {
        phoneNumber: '+1234567890',
        industries: ['Technology'],
        interests: ['AI'],
        location: {
          city: 'New York',
          zipCode: '10001'
        }
      };

      const createdUser = await userRepository.create(userData);

      expect(createdUser).toBeDefined();
      expect(createdUser.phoneNumber).toBe(userData.phoneNumber);
      expect(createdUser.industries).toEqual(expect.arrayContaining(userData.industries!));
      expect(createdUser.interests).toEqual(expect.arrayContaining(userData.interests!));
      expect(createdUser.location.city).toBe(userData.location!.city);
      expect(createdUser.location.zipCode).toBe(userData.location!.zipCode);
    });

    it('should retrieve a user by phone number', async () => {
      const userData: Partial<User> = {
        phoneNumber: '+1987654321',
        industries: ['Finance'],
        interests: ['Blockchain']
      };

      const createdUser = await userRepository.create(userData);
      const retrievedUser = await userRepository.findByPhoneNumber(userData.phoneNumber!);

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser!.id).toBe(createdUser.id);
      expect(retrievedUser!.phoneNumber).toBe(userData.phoneNumber);
    });

    it('should update a user\'s profile', async () => {
      const userData: Partial<User> = {
        phoneNumber: '+1122334455',
        industries: ['Education'],
        interests: ['EdTech']
      };

      const createdUser = await userRepository.create(userData);
      const updatedData: Partial<User> = {
        industries: ['Education', 'Technology'],
        interests: ['EdTech', 'AI']
      };

      const updatedUser = await userRepository.update(createdUser.id, updatedData);

      expect(updatedUser).toBeDefined();
      expect(updatedUser!.industries).toEqual(expect.arrayContaining(updatedData.industries!));
      expect(updatedUser!.interests).toEqual(expect.arrayContaining(updatedData.interests!));
    });
  });

  describe('Connection Operations', () => {
    let user1: User;
    let user2: User;

    beforeEach(async () => {
      user1 = await userRepository.create({
        phoneNumber: '+1111111111',
        industries: ['Technology'],
        interests: ['AI']
      });
      user2 = await userRepository.create({
        phoneNumber: '+2222222222',
        industries: ['Finance'],
        interests: ['Blockchain']
      });
    });

    it('should create a new connection between users', async () => {
      const connectionData: Partial<Connection> = {
        userId: user1.id,
        connectedUserId: user2.id,
        sharedIndustries: ['Technology']
      };

      const createdConnection = await connectionRepository.create(connectionData);

      expect(createdConnection).toBeDefined();
      expect(createdConnection.userId.toString()).toBe(user1.id);
      expect(createdConnection.connectedUserId.toString()).toBe(user2.id);
      expect(createdConnection.sharedIndustries).toEqual(expect.arrayContaining(connectionData.sharedIndustries!));
    });

    it('should retrieve connections for a user', async () => {
      await connectionRepository.create({
        userId: user1.id,
        connectedUserId: user2.id,
        sharedIndustries: ['Technology']
      });

      const connections = await connectionRepository.findByUserId(user1.id);

      expect(connections).toBeDefined();
      expect(connections.length).toBe(1);
      expect(connections[0].connectedUserId.toString()).toBe(user2.id);
    });

    it('should delete a connection', async () => {
      const connection = await connectionRepository.create({
        userId: user1.id,
        connectedUserId: user2.id,
        sharedIndustries: ['Technology']
      });

      await connectionRepository.delete(connection.id);

      const deletedConnection = await connectionRepository.findById(connection.id);
      expect(deletedConnection).toBeNull();
    });
  });

  describe('Caching', () => {
    it('should cache and retrieve user data', async () => {
      const userData: Partial<User> = {
        phoneNumber: '+9876543210',
        industries: ['Healthcare'],
        interests: ['MedTech']
      };

      const createdUser = await userRepository.create(userData);

      // First retrieval should cache the data
      const cachedUser = await userRepository.findById(createdUser.id);
      expect(cachedUser).toBeDefined();

      // Modify the user directly in the database to test cache
      await UserModel.updateOne({ _id: createdUser.id }, { $set: { industries: ['Healthcare', 'Technology'] } });

      // Second retrieval should return cached data
      const cachedUserAgain = await userRepository.findById(createdUser.id);
      expect(cachedUserAgain!.industries).toEqual(userData.industries);

      // Clear cache and retrieve again to get updated data
      await redisClient.del(`user:${createdUser.id}`);
      const updatedUser = await userRepository.findById(createdUser.id);
      expect(updatedUser!.industries).toEqual(['Healthcare', 'Technology']);
    });
  });
});