import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection } from '@backend/models/connection.model';
import { User } from '@backend/models/user.model';
import { ConnectionStatus } from '@shared/enums/connectionStatus.enum';
import { IConnection } from '@shared/interfaces/connection.interface';

describe('Connection Model', () => {
  let mongoServer: MongoMemoryServer;
  let testUsers: { user1: any; user2: any };

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
    // Create test users
    testUsers = {
      user1: await User.create({
        phoneNumber: '+1234567890',
        industries: ['Technology', 'Finance'],
        interests: ['AI', 'Blockchain'],
        location: { city: 'New York', zipCode: '10001' },
      }),
      user2: await User.create({
        phoneNumber: '+1987654321',
        industries: ['Finance', 'Education'],
        interests: ['EdTech', 'Blockchain'],
        location: { city: 'San Francisco', zipCode: '94105' },
      }),
    };
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Connection.deleteMany({});
  });

  test('should create a connection successfully', async () => {
    // Test implementation for Verified Connections requirement
    const connectionData: IConnection = {
      userId: testUsers.user1._id,
      connectedUserId: testUsers.user2._id,
      status: ConnectionStatus.ACTIVE,
      sharedIndustries: ['Finance'],
    };

    const connection = await Connection.create(connectionData);

    expect(connection).toBeDefined();
    expect(connection.userId).toEqual(testUsers.user1._id);
    expect(connection.connectedUserId).toEqual(testUsers.user2._id);
    expect(connection.status).toBe(ConnectionStatus.ACTIVE);
    expect(connection.sharedIndustries).toEqual(['Finance']);
    
    // Verify shared industries calculation (Industry Focus requirement)
    expect(connection.sharedIndustries.length).toBe(1);
    expect(connection.sharedIndustries[0]).toBe('Finance');
  });

  test('should not allow self-connection', async () => {
    const connectionData: IConnection = {
      userId: testUsers.user1._id,
      connectedUserId: testUsers.user1._id,
      status: ConnectionStatus.ACTIVE,
      sharedIndustries: [],
    };

    await expect(Connection.create(connectionData)).rejects.toThrow();
  });

  test('should calculate shared industries', async () => {
    // Test implementation for Industry Focus requirement
    const connectionData: IConnection = {
      userId: testUsers.user1._id,
      connectedUserId: testUsers.user2._id,
      status: ConnectionStatus.ACTIVE,
      sharedIndustries: [],
    };

    const connection = await Connection.create(connectionData);

    expect(connection.sharedIndustries).toEqual(['Finance']);
  });

  test('should update network values', async () => {
    // Test implementation for Quantifiable Networking requirement
    const initialUser1 = await User.findById(testUsers.user1._id);
    const initialUser2 = await User.findById(testUsers.user2._id);

    const connectionData: IConnection = {
      userId: testUsers.user1._id,
      connectedUserId: testUsers.user2._id,
      status: ConnectionStatus.ACTIVE,
      sharedIndustries: ['Finance'],
    };

    await Connection.create(connectionData);

    const updatedUser1 = await User.findById(testUsers.user1._id);
    const updatedUser2 = await User.findById(testUsers.user2._id);

    expect(updatedUser1!.networkValue).toBe(initialUser1!.networkValue + 3.14);
    expect(updatedUser2!.networkValue).toBe(initialUser2!.networkValue + 3.14);
  });

  test('should enforce unique connections', async () => {
    const connectionData: IConnection = {
      userId: testUsers.user1._id,
      connectedUserId: testUsers.user2._id,
      status: ConnectionStatus.ACTIVE,
      sharedIndustries: ['Finance'],
    };

    await Connection.create(connectionData);

    // Attempt to create a duplicate connection
    await expect(Connection.create(connectionData)).rejects.toThrow();
  });
});