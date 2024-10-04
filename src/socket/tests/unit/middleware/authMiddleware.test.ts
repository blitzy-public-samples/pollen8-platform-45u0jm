import { Socket } from 'socket.io';
import { authenticateSocket } from '../../../src/middleware/authMiddleware';
import { getJwtConfig } from '../../../src/config/jwt';
import { ISocketUser } from '../../../src/types/socket.types';
import { createSocketError } from '../../../src/utils/errorHandler';
import { sign } from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../../src/config/jwt');
jest.mock('../../../src/utils/errorHandler');

describe('authenticateSocket Middleware', () => {
  // Constants for testing
  const VALID_USER_ID = 'test123';
  const VALID_INDUSTRIES = ['Tech', 'Finance'];

  // Mock Socket and next function
  let mockSocket: Partial<Socket>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();

    // Create fresh socket mock
    mockSocket = {
      id: 'socket123',
      handshake: {
        auth: {},
        query: {}
      },
      disconnect: jest.fn()
    };

    // Create fresh next function mock
    mockNext = jest.fn();

    // Mock JWT config
    (getJwtConfig as jest.Mock).mockReturnValue({
      publicKey: 'test-public-key',
      algorithm: 'RS256'
    });
  });

  // Helper function to create a valid token
  const createValidToken = (): string => {
    const jwtConfig = getJwtConfig();
    return sign(
      { id: VALID_USER_ID, industries: VALID_INDUSTRIES },
      'test-private-key',
      { algorithm: jwtConfig.algorithm }
    );
  };

  // Helper function to create an expired token
  const createExpiredToken = (): string => {
    const jwtConfig = getJwtConfig();
    return sign(
      { id: VALID_USER_ID, industries: VALID_INDUSTRIES },
      'test-private-key',
      { algorithm: jwtConfig.algorithm, expiresIn: '-1h' }
    );
  };

  it('should authenticate with valid token in auth header', async () => {
    const validToken = createValidToken();
    mockSocket.handshake!.auth = { 'x-auth-token': validToken };

    await authenticateSocket(mockSocket as Socket, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect((mockSocket as ISocketUser).userId).toBe(VALID_USER_ID);
    expect((mockSocket as ISocketUser).industries).toEqual(VALID_INDUSTRIES);
  });

  it('should authenticate with valid token in query params', async () => {
    const validToken = createValidToken();
    mockSocket.handshake!.query = { token: validToken };

    await authenticateSocket(mockSocket as Socket, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect((mockSocket as ISocketUser).userId).toBe(VALID_USER_ID);
    expect((mockSocket as ISocketUser).industries).toEqual(VALID_INDUSTRIES);
  });

  it('should reject connection with missing token', async () => {
    await authenticateSocket(mockSocket as Socket, mockNext);

    expect(createSocketError).toHaveBeenCalledWith(
      expect.any(String),
      'No token provided',
      'socket123'
    );
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reject connection with invalid token format', async () => {
    mockSocket.handshake!.auth = { 'x-auth-token': 'invalid-token' };

    await authenticateSocket(mockSocket as Socket, mockNext);

    expect(createSocketError).toHaveBeenCalledWith(
      expect.any(String),
      'Invalid token'
    );
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reject connection with expired token', async () => {
    const expiredToken = createExpiredToken();
    mockSocket.handshake!.auth = { 'x-auth-token': expiredToken };

    await authenticateSocket(mockSocket as Socket, mockNext);

    expect(createSocketError).toHaveBeenCalledWith(
      expect.any(String),
      'Invalid token'
    );
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reject connection with invalid signature', async () => {
    const invalidToken = sign(
      { id: VALID_USER_ID, industries: VALID_INDUSTRIES },
      'wrong-private-key',
      { algorithm: 'RS256' }
    );
    mockSocket.handshake!.auth = { 'x-auth-token': invalidToken };

    await authenticateSocket(mockSocket as Socket, mockNext);

    expect(createSocketError).toHaveBeenCalledWith(
      expect.any(String),
      'Invalid token'
    );
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reject connection with incomplete user data in token', async () => {
    const incompleteToken = sign(
      { id: VALID_USER_ID }, // Missing industries
      'test-private-key',
      { algorithm: 'RS256' }
    );
    mockSocket.handshake!.auth = { 'x-auth-token': incompleteToken };

    await authenticateSocket(mockSocket as Socket, mockNext);

    expect(createSocketError).toHaveBeenCalledWith(
      expect.any(String),
      'Incomplete user data in token'
    );
    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });

  afterEach(() => {
    // Clean up test artifacts
    jest.clearAllMocks();
  });
});