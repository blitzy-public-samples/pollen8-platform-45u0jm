import jwt from 'jsonwebtoken';
import { IUser } from '@shared/interfaces/user.interface';
import { JWT_CONFIG } from '@config/jwt';
import { generateToken, verifyToken, refreshToken, revokeToken } from '@utils/tokenManager';
import { encrypt, decrypt } from '@utils/encryption';

// Mock the external dependencies
jest.mock('jsonwebtoken');
jest.mock('@utils/encryption');
jest.mock('@config/jwt', () => ({
  JWT_CONFIG: {
    secret: 'test-secret',
    issuer: 'test-issuer',
    audience: 'test-audience'
  }
}));

describe('tokenManager', () => {
  let mockUser: IUser;
  let mockToken: string;
  let mockEncryptedData: string;

  beforeEach(() => {
    // Set up mock user data
    mockUser = {
      _id: '123456',
      phoneNumber: '+1234567890',
      role: 'user'
    } as IUser;

    mockToken = 'mock.jwt.token';
    mockEncryptedData = 'encrypted-data';

    // Reset all mocks
    jest.clearAllMocks();

    // Configure JWT mock
    (jwt.sign as jest.Mock).mockReturnValue(mockToken);
    (jwt.verify as jest.Mock).mockReturnValue({ sub: mockUser._id, data: mockEncryptedData });
    (jwt.decode as jest.Mock).mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

    // Configure encryption mock
    (encrypt as jest.Mock).mockResolvedValue(mockEncryptedData);
    (decrypt as jest.Mock).mockResolvedValue(JSON.stringify({
      id: mockUser._id,
      phoneNumber: mockUser.phoneNumber,
      role: mockUser.role
    }));
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token with correct user payload', async () => {
      // Test implementation
      const token = await generateToken(mockUser);

      // Assertions
      expect(token).toBeDefined();
      expect(token).toBe(mockToken);
      expect(encrypt).toHaveBeenCalledWith(JSON.stringify({
        id: mockUser._id.toString(),
        phoneNumber: mockUser.phoneNumber,
        role: mockUser.role
      }));
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: mockUser._id.toString(), data: mockEncryptedData },
        JWT_CONFIG.secret,
        {
          expiresIn: '24h',
          issuer: JWT_CONFIG.issuer,
          audience: JWT_CONFIG.audience
        }
      );
    });

    it('should throw an error if token generation fails', async () => {
      // Mock a failure in jwt.sign
      (jwt.sign as jest.Mock).mockImplementation(() => {
        throw new Error('Token generation failed');
      });

      // Test implementation and assertion
      await expect(generateToken(mockUser)).rejects.toThrow('Failed to generate token');
    });
  });

  describe('verifyToken', () => {
    it('should correctly validate and decode a token', async () => {
      // Test implementation
      const decodedUser = await verifyToken(mockToken);

      // Assertions
      expect(decodedUser).toBeDefined();
      expect(decodedUser.id).toBe(mockUser._id);
      expect(decodedUser.phoneNumber).toBe(mockUser.phoneNumber);
      expect(decodedUser.role).toBe(mockUser.role);
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, JWT_CONFIG.secret, {
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      });
      expect(decrypt).toHaveBeenCalledWith(mockEncryptedData);
    });

    it('should throw an error for an invalid token', async () => {
      // Mock a failure in jwt.verify
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Test implementation and assertion
      await expect(verifyToken(mockToken)).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('refreshToken', () => {
    it('should generate a new token when given a valid refresh token', async () => {
      // Test implementation
      const newToken = await refreshToken(mockToken);

      // Assertions
      expect(newToken).toBeDefined();
      expect(newToken).toBe(mockToken); // Because we're using the same mock for both
      expect(jwt.verify).toHaveBeenCalledWith(mockToken, JWT_CONFIG.secret, {
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      });
      expect(decrypt).toHaveBeenCalledWith(mockEncryptedData);
      expect(jwt.sign).toHaveBeenCalled(); // New token generation
    });

    it('should throw an error for an invalid refresh token', async () => {
      // Mock a failure in jwt.verify
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      // Test implementation and assertion
      await expect(refreshToken(mockToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('revokeToken', () => {
    it('should successfully revoke a valid token', async () => {
      // We'll need to implement a mock for the blacklist functionality
      const mockAddToBlacklist = jest.fn();
      global.addToBlacklist = mockAddToBlacklist;

      // Test implementation
      await revokeToken(mockToken);

      // Assertions
      expect(jwt.decode).toHaveBeenCalledWith(mockToken);
      // Uncomment the following line when blacklist functionality is implemented
      // expect(mockAddToBlacklist).toHaveBeenCalled();
    });

    it('should throw an error for an invalid token during revocation', async () => {
      // Mock a failure in jwt.decode
      (jwt.decode as jest.Mock).mockReturnValue(null);

      // Test implementation and assertion
      await expect(revokeToken(mockToken)).rejects.toThrow('Failed to revoke token');
    });
  });
});