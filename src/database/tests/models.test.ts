import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserModel, IUserDocument } from '../models/user.model';
import { ConnectionModel, IConnectionDocument } from '../models/connection.model';
import { InviteModel } from '../models/invite.model';
import { IndustryModel } from '../models/industry.model';
import { InterestModel } from '../models/interest.model';
import { LocationModel } from '../models/location.model';
import { ConnectionStatus } from '../../shared/interfaces/connection.interface';

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
  await Promise.all([
    UserModel.deleteMany({}),
    ConnectionModel.deleteMany({}),
    InviteModel.deleteMany({}),
    IndustryModel.deleteMany({}),
    InterestModel.deleteMany({}),
    LocationModel.deleteMany({})
  ]);
});

const createTestUser = async (overrides: Partial<IUserDocument> = {}): Promise<IUserDocument> => {
  const defaultUser = {
    phoneNumber: '+12345678901',
    industries: [],
    interests: [],
    location: {
      city: 'New York',
      zipCode: '10001'
    }
  };
  const userData = { ...defaultUser, ...overrides };
  return await UserModel.create(userData);
};

const createTestIndustries = async (count: number): Promise<string[]> => {
  const industries = await Promise.all(
    Array.from({ length: count }, (_, i) => IndustryModel.create({ name: `Industry ${i + 1}` }))
  );
  return industries.map(industry => industry._id.toString());
};

describe('UserModel', () => {
  it('should create a valid user', async () => {
    const industries = await createTestIndustries(3);
    const user = await createTestUser({ industries });
    expect(user._id).toBeDefined();
    expect(user.phoneNumber).toBe('+12345678901');
    expect(user.industries.length).toBe(3);
    expect(user.networkValue).toBe(0);
    expect(user.connectionCount).toBe(0);
  });

  it('should fail with invalid phone number', async () => {
    await expect(createTestUser({ phoneNumber: 'invalid' })).rejects.toThrow();
  });

  it('should require minimum 1 industry', async () => {
    await expect(createTestUser({ industries: [] })).rejects.toThrow();
  });

  it('should calculate network value correctly', async () => {
    const industries = await createTestIndustries(3);
    const user = await createTestUser({ industries });
    user.connectionCount = 5;
    await user.save();
    expect(user.networkValue).toBeCloseTo(5 * 3.14, 2);
  });
});

describe('ConnectionModel', () => {
  it('should create a valid connection', async () => {
    const industries = await createTestIndustries(3);
    const user1 = await createTestUser({ industries });
    const user2 = await createTestUser({ industries });
    const connection = await ConnectionModel.create({
      userId: user1._id,
      connectedUserId: user2._id,
      status: ConnectionStatus.PENDING
    });
    expect(connection._id).toBeDefined();
    expect(connection.status).toBe(ConnectionStatus.PENDING);
  });

  it('should update user network values on accepted connection', async () => {
    const industries = await createTestIndustries(3);
    const user1 = await createTestUser({ industries });
    const user2 = await createTestUser({ industries });
    const connection = await ConnectionModel.create({
      userId: user1._id,
      connectedUserId: user2._id,
      status: ConnectionStatus.PENDING
    });
    connection.status = ConnectionStatus.ACCEPTED;
    await connection.save();

    const updatedUser1 = await UserModel.findById(user1._id);
    const updatedUser2 = await UserModel.findById(user2._id);

    expect(updatedUser1?.connectionCount).toBe(1);
    expect(updatedUser2?.connectionCount).toBe(1);
    expect(updatedUser1?.networkValue).toBeCloseTo(3.14, 2);
    expect(updatedUser2?.networkValue).toBeCloseTo(3.14, 2);
  });
});

describe('InviteModel', () => {
  it('should generate unique invite code', async () => {
    const user = await createTestUser();
    const invite1 = await InviteModel.create({ userId: user._id, name: 'Invite 1' });
    const invite2 = await InviteModel.create({ userId: user._id, name: 'Invite 2' });
    expect(invite1.code).toBeDefined();
    expect(invite2.code).toBeDefined();
    expect(invite1.code).not.toBe(invite2.code);
  });

  it('should track click counts correctly', async () => {
    const user = await createTestUser();
    const invite = await InviteModel.create({ userId: user._id, name: 'Test Invite' });
    invite.clickCount = 5;
    await invite.save();
    expect(invite.clickCount).toBe(5);
  });
});

// Additional tests for IndustryModel, InterestModel, and LocationModel can be added here