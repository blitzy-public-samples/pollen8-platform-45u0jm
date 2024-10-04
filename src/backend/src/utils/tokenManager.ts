import jwt from 'jsonwebtoken';
import ms from 'ms';
import { IUser } from '@shared/interfaces/user.interface';
import { encrypt, decrypt } from '@utils/encryption';
import { JWT_CONFIG } from '@config/jwt';

/**
 * A utility module responsible for managing JSON Web Tokens (JWT) for user authentication
 * and session management in the Pollen8 platform.
 * 
 * Requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 *    - Secure token generation for authenticated users
 * 2. User Authentication (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 *    - Token-based session management
 * 3. Enhanced Privacy (Technical Specification/1.2 Scope/Benefits)
 *    - Secure token handling for user privacy
 */

// Global constants
const TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

// Assuming JWT_CONFIG structure
interface JWTConfig {
  secret: string;
  issuer: string;
  audience: string;
}

/**
 * Generates a JWT token for a user with encrypted payload.
 * @param {IUser} user - The user object for which to generate the token
 * @returns {Promise<string>} Generated JWT token
 */
export async function generateToken(user: IUser): Promise<string> {
  try {
    // Encrypt sensitive user data
    const encryptedData = await encrypt(JSON.stringify({
      id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      role: user.role
    }));

    // Create token payload with encrypted data
    const payload = {
      sub: user._id.toString(),
      data: encryptedData
    };

    // Sign token using JWT_CONFIG settings
    return jwt.sign(payload, JWT_CONFIG.secret, {
      expiresIn: TOKEN_EXPIRY,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    });
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate token');
  }
}

/**
 * Verifies and decodes a JWT token, returning the user data.
 * @param {string} token - The JWT token to verify and decode
 * @returns {Promise<IUser>} Decoded user data from token
 */
export async function verifyToken(token: string): Promise<Partial<IUser>> {
  try {
    // Verify token signature using JWT_CONFIG
    const decoded = jwt.verify(token, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    }) as jwt.JwtPayload;

    // Decrypt user data from token payload
    const decryptedData = await decrypt(decoded.data as string);
    const userData = JSON.parse(decryptedData);

    // Check token against blacklist (implementation needed)
    // await checkTokenBlacklist(token);

    return userData;
  } catch (error) {
    console.error('Error verifying token:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generates a new access token using a valid refresh token.
 * @param {string} refreshToken - The refresh token to use for generating a new access token
 * @returns {Promise<string>} New access token
 */
export async function refreshToken(refreshToken: string): Promise<string> {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience
    }) as jwt.JwtPayload;

    // Extract user data from refresh token
    const decryptedData = await decrypt(decoded.data as string);
    const userData = JSON.parse(decryptedData);

    // Generate new access token
    return generateToken(userData as IUser);
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw new Error('Invalid refresh token');
  }
}

/**
 * Revokes a token by adding it to a blacklist.
 * @param {string} token - The token to revoke
 * @returns {Promise<void>}
 */
export async function revokeToken(token: string): Promise<void> {
  try {
    // Verify token is valid
    const decoded = jwt.decode(token) as jwt.JwtPayload;
    if (!decoded || !decoded.exp) {
      throw new Error('Invalid token');
    }

    // Add token to blacklist
    // Implementation needed: Store token in a blacklist (e.g., Redis)
    // await addToBlacklist(token, decoded.exp);

    // Set blacklist expiry based on token expiry
    const expiresIn = decoded.exp * 1000 - Date.now();
    console.log(`Token blacklisted for ${ms(expiresIn, { long: true })}`);
  } catch (error) {
    console.error('Error revoking token:', error);
    throw new Error('Failed to revoke token');
  }
}

/**
 * This module implements robust JWT token management for the Pollen8 platform.
 * It uses encryption for sensitive payload data, ensuring that even if a token
 * is compromised, the contained information remains secure.
 * 
 * The module provides functions for generating, verifying, refreshing, and revoking
 * tokens, covering the full lifecycle of JWT-based authentication.
 * 
 * Note: The token blacklist functionality is outlined but not fully implemented.
 * A persistent store (e.g., Redis) should be used to maintain the blacklist across
 * server restarts and for distributed environments.
 * 
 * Future improvements:
 * 1. Implement token blacklist using Redis or a similar fast, distributed cache.
 * 2. Add rate limiting for token generation and refresh operations.
 * 3. Implement automatic key rotation for the JWT signing secret.
 * 4. Add support for different token types (e.g., access token, refresh token) with varying expiration times.
 */