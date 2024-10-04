import { ObjectId } from 'mongodb';
import supertest from 'supertest';
import { app } from '../../src/app';
import { IInvite, InviteResponse } from '@shared/interfaces/invite.interface';
import { setupTestDB, clearTestDB } from '../utils/testing';

const request = supertest(app);

describe('Invite API Integration Tests', () => {
  let testUser: { _id: ObjectId; phoneNumber: string };
  let testInvite: IInvite;

  beforeAll(async () => {
    await setupTestDB();
    // Create a test user for invite operations
    testUser = {
      _id: new ObjectId(),
      phoneNumber: '+1234567890'
    };
    // TODO: Implement user creation in the database
  });

  afterAll(async () => {
    await clearTestDB();
  });

  beforeEach(async () => {
    // Clear existing invites from test database
    // TODO: Implement invite clearing logic
    // Reset any mock functions
    jest.clearAllMocks();
  });

  const createTestInvite = async (userId: ObjectId, name: string): Promise<IInvite> => {
    // TODO: Implement invite creation logic
    return {
      _id: new ObjectId(),
      userId,
      name,
      code: 'testcode',
      clickCount: 0,
      dailyClickData: {},
      createdAt: new Date(),
      isActive: true
    };
  };

  const generateAuthToken = (userId: ObjectId): string => {
    // TODO: Implement JWT token generation
    return 'dummy_token';
  };

  describe('POST /api/invites', () => {
    it('should create a new invite', async () => {
      const inviteName = 'Test Invite';
      const response = await request
        .post('/api/invites')
        .set('Authorization', `Bearer ${generateAuthToken(testUser._id)}`)
        .send({ name: inviteName });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('invite');
      expect(response.body.invite.name).toBe(inviteName);
      expect(response.body.invite.userId).toBe(testUser._id.toString());
    });

    it('should return 400 for invalid invite data', async () => {
      const response = await request
        .post('/api/invites')
        .set('Authorization', `Bearer ${generateAuthToken(testUser._id)}`)
        .send({ name: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/invites/:id', () => {
    it('should retrieve an invite by ID', async () => {
      testInvite = await createTestInvite(testUser._id, 'Test Invite');

      const response = await request
        .get(`/api/invites/${testInvite._id}`)
        .set('Authorization', `Bearer ${generateAuthToken(testUser._id)}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('invite');
      expect(response.body.invite._id).toBe(testInvite._id.toString());
    });

    it('should return 404 for non-existent invite', async () => {
      const nonExistentId = new ObjectId();
      const response = await request
        .get(`/api/invites/${nonExistentId}`)
        .set('Authorization', `Bearer ${generateAuthToken(testUser._id)}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/invites/:id', () => {
    it('should update an invite', async () => {
      testInvite = await createTestInvite(testUser._id, 'Original Name');
      const updatedName = 'Updated Name';

      const response = await request
        .put(`/api/invites/${testInvite._id}`)
        .set('Authorization', `Bearer ${generateAuthToken(testUser._id)}`)
        .send({ name: updatedName });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('invite');
      expect(response.body.invite.name).toBe(updatedName);
    });

    it('should return 403 when updating invite of another user', async () => {
      const anotherUserId = new ObjectId();
      testInvite = await createTestInvite(anotherUserId, 'Another User\'s Invite');

      const response = await request
        .put(`/api/invites/${testInvite._id}`)
        .set('Authorization', `Bearer ${generateAuthToken(testUser._id)}`)
        .send({ name: 'Attempt to Update' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/invites/:id', () => {
    it('should delete an invite', async () => {
      testInvite = await createTestInvite(testUser._id, 'To Be Deleted');

      const response = await request
        .delete(`/api/invites/${testInvite._id}`)
        .set('Authorization', `Bearer ${generateAuthToken(testUser._id)}`);

      expect(response.status).toBe(204);

      // Verify invite is deleted
      const getResponse = await request
        .get(`/api/invites/${testInvite._id}`)
        .set('Authorization', `Bearer ${generateAuthToken(testUser._id)}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 403 when deleting invite of another user', async () => {
      const anotherUserId = new ObjectId();
      testInvite = await createTestInvite(anotherUserId, 'Another User\'s Invite');

      const response = await request
        .delete(`/api/invites/${testInvite._id}`)
        .set('Authorization', `Bearer ${generateAuthToken(testUser._id)}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/invites/:id/analytics', () => {
    it('should retrieve invite analytics', async () => {
      testInvite = await createTestInvite(testUser._id, 'Analytics Test Invite');

      const response = await request
        .get(`/api/invites/${testInvite._id}/analytics`)
        .set('Authorization', `Bearer ${generateAuthToken(testUser._id)}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('analytics');
      expect(response.body.analytics).toHaveProperty('totalClicks');
      expect(response.body.analytics).toHaveProperty('dailyTrend');
    });

    it('should return 403 when accessing analytics of another user\'s invite', async () => {
      const anotherUserId = new ObjectId();
      testInvite = await createTestInvite(anotherUserId, 'Another User\'s Invite');

      const response = await request
        .get(`/api/invites/${testInvite._id}/analytics`)
        .set('Authorization', `Bearer ${generateAuthToken(testUser._id)}`);

      expect(response.status).toBe(403);
    });
  });
});