import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../src/app';
import { NetworkService } from '../../src/services/network.service';
import { UserRepository } from '../../../database/repositories/user.repository';
import { ConnectionRepository } from '../../../database/repositories/connection.repository';
import { IUser } from '../../../shared/interfaces/user.interface';
import { IConnection, IConnectionCreate, ConnectionStatus } from '../../../shared/interfaces/connection.interface';
import { NetworkGraphData } from '../../../shared/types/network.types';
import { BASE_CONNECTION_VALUE } from '../../../shared/constants/networkValue';

describe('Network Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let networkService: NetworkService;
  let userRepository: UserRepository;
  let connectionRepository: ConnectionRepository;
  let testUsers: IUser[];
  let testConnections: IConnection[];

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    userRepository = new UserRepository();
    connectionRepository = new ConnectionRepository();
    networkService = new NetworkService(
      connectionRepository,
      userRepository,
      {} as any, // IndustryRepository mock
      {} as any, // CacheService mock
      {} as any, // EventEmitter mock
      console as any // Logger mock
    );

    // Create test users
    testUsers = await Promise.all([
      createTestUser({ phoneNumber: '+1234567890', industries: ['tech', 'finance'] }),
      createTestUser({ phoneNumber: '+0987654321', industries: ['finance', 'healthcare'] }),
      createTestUser({ phoneNumber: '+1122334455', industries: ['tech', 'education'] })
    ]);

    // Create test connections
    testConnections = await Promise.all([
      createTestConnection({ userId: testUsers[0]._id, connectedUserId: testUsers[1]._id, status: ConnectionStatus.ACCEPTED }),
      createTestConnection({ userId: testUsers[0]._id, connectedUserId: testUsers[2]._id, status: ConnectionStatus.PENDING })
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  describe('POST /network', () => {
    it('should create a new connection between users', async () => {
      const connectionData: IConnectionCreate = {
        userId: testUsers[1]._id,
        connectedUserId: testUsers[2]._id
      };

      const response = await request(app)
        .post('/network')
        .send(connectionData)
        .expect(201);

      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.userId).toBe(connectionData.userId.toString());
      expect(response.body.data.connectedUserId).toBe(connectionData.connectedUserId.toString());
      expect(response.body.data.status).toBe(ConnectionStatus.PENDING);
    });

    it('should return 400 for duplicate connection attempt', async () => {
      const connectionData: IConnectionCreate = {
        userId: testUsers[0]._id,
        connectedUserId: testUsers[1]._id
      };

      await request(app)
        .post('/network')
        .send(connectionData)
        .expect(400);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const connectionData: IConnectionCreate = {
        userId: nonExistentId,
        connectedUserId: testUsers[1]._id
      };

      await request(app)
        .post('/network')
        .send(connectionData)
        .expect(404);
    });

    it('should calculate shared industries correctly', async () => {
      const connectionData: IConnectionCreate = {
        userId: testUsers[0]._id,
        connectedUserId: testUsers[1]._id
      };

      const response = await request(app)
        .post('/network')
        .send(connectionData)
        .expect(201);

      expect(response.body.data.sharedIndustries).toContain('finance');
      expect(response.body.data.sharedIndustries).toHaveLength(1);
    });
  });

  describe('GET /network/value', () => {
    it('should return correct network value for user', async () => {
      const response = await request(app)
        .get(`/network/value/${testUsers[0]._id}`)
        .expect(200);

      const expectedValue = testConnections.filter(c => 
        c.userId.equals(testUsers[0]._id) && c.status === ConnectionStatus.ACCEPTED
      ).length * BASE_CONNECTION_VALUE;

      expect(response.body.data.networkValue).toBe(expectedValue);
    });

    it('should return 0 for user with no connections', async () => {
      const newUser = await createTestUser({ phoneNumber: '+9876543210', industries: ['tech'] });

      const response = await request(app)
        .get(`/network/value/${newUser._id}`)
        .expect(200);

      expect(response.body.data.networkValue).toBe(0);
    });

    it('should update value when connection is removed', async () => {
      // First, get initial network value
      const initialResponse = await request(app)
        .get(`/network/value/${testUsers[0]._id}`)
        .expect(200);

      const initialValue = initialResponse.body.data.networkValue;

      // Remove a connection
      await connectionRepository.delete(testConnections[0]._id);

      // Get updated network value
      const updatedResponse = await request(app)
        .get(`/network/value/${testUsers[0]._id}`)
        .expect(200);

      const updatedValue = updatedResponse.body.data.networkValue;

      expect(updatedValue).toBe(initialValue - BASE_CONNECTION_VALUE);
    });
  });

  describe('GET /network/industry/:industryId', () => {
    it('should return connections filtered by industry', async () => {
      const response = await request(app)
        .get(`/network/industry/${testUsers[0]._id}/tech`)
        .expect(200);

      expect(response.body.data.connections).toHaveLength(1);
      expect(response.body.data.connections[0].sharedIndustries).toContain('tech');
    });

    it('should return empty array for industry with no connections', async () => {
      const response = await request(app)
        .get(`/network/industry/${testUsers[0]._id}/healthcare`)
        .expect(200);

      expect(response.body.data.connections).toHaveLength(0);
    });

    it('should return 404 for non-existent industry', async () => {
      await request(app)
        .get(`/network/industry/${testUsers[0]._id}/nonexistent`)
        .expect(404);
    });
  });

  describe('GET /network/graph', () => {
    it('should return correctly formatted data for D3.js', async () => {
      const response = await request(app)
        .get(`/network/graph/${testUsers[0]._id}`)
        .expect(200);

      const graphData: NetworkGraphData = response.body.data;

      expect(graphData).toHaveProperty('nodes');
      expect(graphData).toHaveProperty('links');
      expect(graphData.nodes).toHaveLength(3); // testUser[0] and its two connections
      expect(graphData.links).toHaveLength(2); // Two connections for testUser[0]
    });

    it('should handle pagination of large networks', async () => {
      // Create 50 more users and connect them to testUser[0]
      for (let i = 0; i < 50; i++) {
        const newUser = await createTestUser({ phoneNumber: `+1000000${i}`, industries: ['tech'] });
        await createTestConnection({ userId: testUsers[0]._id, connectedUserId: newUser._id, status: ConnectionStatus.ACCEPTED });
      }

      const response = await request(app)
        .get(`/network/graph/${testUsers[0]._id}?page=1&limit=20`)
        .expect(200);

      const graphData: NetworkGraphData = response.body.data;

      expect(graphData.nodes).toHaveLength(21); // 20 connections + testUser[0]
      expect(graphData.links).toHaveLength(20);
      expect(response.body.meta.totalPages).toBe(3); // 52 total connections, 20 per page
    });

    it('should include industry information in nodes', async () => {
      const response = await request(app)
        .get(`/network/graph/${testUsers[0]._id}`)
        .expect(200);

      const graphData: NetworkGraphData = response.body.data;

      expect(graphData.nodes[0]).toHaveProperty('industries');
      expect(graphData.nodes[0].industries).toContain('tech');
      expect(graphData.nodes[0].industries).toContain('finance');
    });
  });

  describe('PATCH /network/:connectionId', () => {
    it('should update connection status successfully', async () => {
      const response = await request(app)
        .patch(`/network/${testConnections[1]._id}`)
        .send({ status: ConnectionStatus.ACCEPTED })
        .expect(200);

      expect(response.body.data.status).toBe(ConnectionStatus.ACCEPTED);
    });

    it('should return 404 for non-existent connection', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await request(app)
        .patch(`/network/${nonExistentId}`)
        .send({ status: ConnectionStatus.ACCEPTED })
        .expect(404);
    });

    it('should validate status transitions', async () => {
      await request(app)
        .patch(`/network/${testConnections[0]._id}`)
        .send({ status: ConnectionStatus.PENDING })
        .expect(400);
    });

    it('should recalculate network values after status change', async () => {
      // Get initial network value
      const initialResponse = await request(app)
        .get(`/network/value/${testUsers[0]._id}`)
        .expect(200);

      const initialValue = initialResponse.body.data.networkValue;

      // Update connection status
      await request(app)
        .patch(`/network/${testConnections[1]._id}`)
        .send({ status: ConnectionStatus.ACCEPTED })
        .expect(200);

      // Get updated network value
      const updatedResponse = await request(app)
        .get(`/network/value/${testUsers[0]._id}`)
        .expect(200);

      const updatedValue = updatedResponse.body.data.networkValue;

      expect(updatedValue).toBe(initialValue + BASE_CONNECTION_VALUE);
    });
  });

  // Helper functions
  async function createTestUser(userData: Partial<IUser>): Promise<IUser> {
    return await userRepository.create({
      phoneNumber: userData.phoneNumber,
      industries: userData.industries,
      networkValue: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    } as IUser);
  }

  async function createTestConnection(connectionData: IConnectionCreate & { status: ConnectionStatus }): Promise<IConnection> {
    return await connectionRepository.create({
      ...connectionData,
      sharedIndustries: [],
      createdAt: new Date(),
      updatedAt: new Date()
    } as IConnection);
  }

  async function cleanupTestData(): Promise<void> {
    await userRepository.deleteMany({});
    await connectionRepository.deleteMany({});
  }
});