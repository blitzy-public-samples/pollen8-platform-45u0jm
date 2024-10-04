import { Socket } from 'socket.io';
import { verify } from 'jsonwebtoken';
import { ISocketUser } from '../types/socket.types';
import { getJwtConfig } from '../config/jwt';
import { createSocketError, SocketErrorCode, handleSocketError } from '../utils/errorHandler';
import { IUser } from '@shared/interfaces/user.interface';

// Constants for token extraction
const TOKEN_HEADER = 'x-auth-token';
const TOKEN_QUERY = 'token';

/**
 * Middleware function to authenticate WebSocket connections using JWT
 * @param socket - The Socket instance
 * @param next - The next function to call
 * @description Ensures authentic WebSocket connections as per Technical Specification/1.1 System Objectives
 */
export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
  try {
    const token = extractToken(socket);
    if (!token) {
      throw createSocketError(SocketErrorCode.AUTHENTICATION_FAILED, 'No token provided', socket.id);
    }

    const user = await verifyToken(token);
    attachUserToSocket(socket, user);
    next();
  } catch (error) {
    handleSocketError(error as Error, socket);
    next(error as Error);
  }
};

/**
 * Extracts the JWT token from socket handshake auth or query
 * @param socket - The Socket instance
 * @returns The extracted token or null if not found
 */
const extractToken = (socket: Socket): string | null => {
  if (socket.handshake.auth && socket.handshake.auth[TOKEN_HEADER]) {
    return socket.handshake.auth[TOKEN_HEADER] as string;
  }
  if (socket.handshake.query && socket.handshake.query[TOKEN_QUERY]) {
    return socket.handshake.query[TOKEN_QUERY] as string;
  }
  return null;
};

/**
 * Verifies the JWT token and returns the user data
 * @param token - The JWT token to verify
 * @returns Promise resolving to the verified user data
 * @throws Error if token verification fails
 * @description Implements JWT-based socket connection validation as per Technical Specification/5. Security Considerations
 */
const verifyToken = async (token: string): Promise<IUser> => {
  const jwtConfig = getJwtConfig();
  return new Promise((resolve, reject) => {
    verify(token, jwtConfig.publicKey, { algorithms: [jwtConfig.algorithm] }, (err, decoded) => {
      if (err) {
        reject(createSocketError(SocketErrorCode.AUTHENTICATION_FAILED, 'Invalid token'));
      } else if (typeof decoded === 'object' && decoded !== null) {
        const user = decoded as IUser;
        if (!user.id || !user.industries) {
          reject(createSocketError(SocketErrorCode.AUTHENTICATION_FAILED, 'Incomplete user data in token'));
        } else {
          resolve(user);
        }
      } else {
        reject(createSocketError(SocketErrorCode.AUTHENTICATION_FAILED, 'Invalid token payload'));
      }
    });
  });
};

/**
 * Attaches user data to the socket instance
 * @param socket - The Socket instance
 * @param user - The verified user data
 * @description Enhances socket with user-specific data for secure real-time communication
 */
const attachUserToSocket = (socket: Socket, user: IUser): void => {
  const socketUser = socket as ISocketUser;
  socketUser.userId = user.id;
  socketUser.industries = user.industries;
};

/**
 * @fileoverview This file implements the authentication middleware for WebSocket connections in the Pollen8 platform.
 * It ensures secure and verified real-time communication by validating JWT tokens and attaching user data to socket connections.
 *
 * Key features:
 * 1. JWT token extraction from socket handshake
 * 2. Token verification using asymmetric encryption (RS256 algorithm)
 * 3. User data attachment to socket for authenticated sessions
 * 4. Comprehensive error handling for various authentication scenarios
 *
 * This implementation addresses the following requirements:
 * - Verified Connections (Technical Specification/1.1 System Objectives)
 * - Enhanced Privacy (Technical Specification/1.2 Scope/Benefits)
 * - Security Protocols (Technical Specification/5. Security Considerations)
 *
 * The authentication middleware ensures that only verified users can establish WebSocket connections,
 * enhancing the overall security and integrity of real-time communication in the Pollen8 platform.
 */