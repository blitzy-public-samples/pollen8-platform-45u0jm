import { Server } from 'socket.io';
import { io as ioc, Socket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import App from '../../src/app';
import { ISocketUser, IServerToClientEvents, IClientToServerEvents } from '../../src/types/socket.types';
import { testSetup, teardown } from '../setup';

describe('WebSocket Server Integration Tests', () => {
  let app: App;
  let testPort: number;
  let mockUser: { id: string; industries: string[] };

  beforeAll(async () => {
    // Set up test environment
    ({ app, testPort } = await testSetup());
    mockUser = { id: 'testUser123', industries: ['Technology', 'Finance'] };
  });

  afterAll(async () => {
    await teardown();
  });

  const createTestClient = async (token?: string): Promise<Socket<IServerToClientEvents, IClientToServerEvents>> => {
    return new Promise((resolve) => {
      const client = ioc(`http://localhost:${testPort}`, {
        auth: token ? { token } : undefined,
        transports: ['websocket'],
      });
      client.on('connect', () => resolve(client));
    });
  };

  const generateTestToken = (userData: typeof mockUser): string => {
    return jwt.sign(userData, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' });
  };

  describe('Authentication Tests', () => {
    it('should successfully connect with a valid token', async () => {
      const token = generateTestToken(mockUser);
      const client = await createTestClient(token);
      expect(client.connected).toBe(true);
      client.disconnect();
    });

    it('should fail to connect with an invalid token', async () => {
      const invalidToken = 'invalid_token';
      await expect(createTestClient(invalidToken)).rejects.toThrow();
    });

    it('should fail to connect with an expired token', async () => {
      const expiredToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'test_secret', { expiresIn: '0s' });
      await expect(createTestClient(expiredToken)).rejects.toThrow();
    });

    it('should fail to connect with no token', async () => {
      await expect(createTestClient()).rejects.toThrow();
    });
  });

  describe('Connection Handler Tests', () => {
    let client: Socket<IServerToClientEvents, IClientToServerEvents>;

    beforeEach(async () => {
      const token = generateTestToken(mockUser);
      client = await createTestClient(token);
    });

    afterEach(() => {
      client.disconnect();
    });

    it('should handle successful connection request', (done) => {
      client.emit('connection:request', (response) => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Connection request received');
        done();
      });
    });

    it('should handle connection acceptance', (done) => {
      const targetUserId = 'targetUser456';
      client.emit('connection:accept', { targetUserId }, (response) => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Connection accepted');
        done();
      });
    });

    it('should handle connection rejection', (done) => {
      const targetUserId = 'targetUser789';
      client.emit('connection:reject', { targetUserId }, (response) => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Connection rejected');
        done();
      });
    });

    it('should broadcast industry-specific events', (done) => {
      const eventData = { industry: 'Technology', message: 'New tech event!' };
      client.on('industry:update', (data) => {
        expect(data).toEqual(eventData);
        done();
      });
      app.getIO().emit('industry:update', eventData);
    });

    it('should update network value (3.14 per connection)', (done) => {
      client.on('network:valueUpdate', (data) => {
        expect(data.newValue).toBe(3.14);
        done();
      });
      app.getIO().emit('network:valueUpdate', { userId: mockUser.id, newValue: 3.14 });
    });
  });

  describe('Invite Handler Tests', () => {
    let client: Socket<IServerToClientEvents, IClientToServerEvents>;

    beforeEach(async () => {
      const token = generateTestToken(mockUser);
      client = await createTestClient(token);
    });

    afterEach(() => {
      client.disconnect();
    });

    it('should track invite clicks', (done) => {
      const inviteCode = 'TEST123';
      client.emit('invite:click', { inviteCode }, (response) => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Invite click tracked');
        done();
      });
    });

    it('should update real-time analytics', (done) => {
      const analyticsData = { inviteCode: 'TEST123', clicks: 5 };
      client.on('invite:analyticsUpdate', (data) => {
        expect(data).toEqual(analyticsData);
        done();
      });
      app.getIO().emit('invite:analyticsUpdate', analyticsData);
    });

    it('should handle invalid invite', (done) => {
      const invalidInviteCode = 'INVALID123';
      client.emit('invite:click', { inviteCode: invalidInviteCode }, (response) => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('Invalid invite code');
        done();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple simultaneous connections', async () => {
      const numConnections = 50;
      const clients: Socket[] = [];

      for (let i = 0; i < numConnections; i++) {
        const token = generateTestToken({ ...mockUser, id: `testUser${i}` });
        const client = await createTestClient(token);
        clients.push(client);
      }

      expect(clients.every(client => client.connected)).toBe(true);

      clients.forEach(client => client.disconnect());
    });

    it('should handle rapid event emission', (done) => {
      const token = generateTestToken(mockUser);
      createTestClient(token).then(client => {
        let receivedCount = 0;
        const totalEvents = 100;

        client.on('test:rapidEvent', () => {
          receivedCount++;
          if (receivedCount === totalEvents) {
            expect(receivedCount).toBe(totalEvents);
            client.disconnect();
            done();
          }
        });

        for (let i = 0; i < totalEvents; i++) {
          app.getIO().emit('test:rapidEvent');
        }
      });
    });

    it('should handle large payload', (done) => {
      const token = generateTestToken(mockUser);
      createTestClient(token).then(client => {
        const largePayload = { data: 'x'.repeat(1000000) }; // 1MB payload

        client.on('test:largePayload', (data) => {
          expect(data).toEqual(largePayload);
          client.disconnect();
          done();
        });

        app.getIO().emit('test:largePayload', largePayload);
      });
    });
  });
});