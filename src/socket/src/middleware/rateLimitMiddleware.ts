import { Socket } from 'socket.io';
import { redisService } from '../services/redisService';
import { socketLogger } from '../utils/logger';
import { socketMetrics } from '../utils/metrics';
import { ISocketUser } from '../types/socket.types';
import { createSocketError, SocketErrorCode } from '../utils/errorHandler';

/**
 * Configuration interface for rate limiting
 */
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

// Default rate limit configuration
const DEFAULT_WINDOW_MS = 60000; // 1 minute
const DEFAULT_MAX_REQUESTS = 100;
const DEFAULT_KEY_PREFIX = 'pollen8:ratelimit:';

/**
 * Creates a rate limit middleware function with the specified configuration
 * @param {RateLimitConfig} config - Rate limit configuration
 * @returns {(socket: ISocketUser, next: (err?: Error) => void) => Promise<void>} Middleware function
 */
export const createRateLimitMiddleware = (config: RateLimitConfig) => {
  const { windowMs, maxRequests, keyPrefix } = config;

  return async (socket: ISocketUser, next: (err?: Error) => void): Promise<void> => {
    try {
      const userId = socket.user?.id;
      if (!userId) {
        return next(createSocketError(SocketErrorCode.UNAUTHORIZED, 'User not authenticated'));
      }

      const key = `${keyPrefix}${userId}`;
      const currentCount = await redisService.getSocketData(key) || 0;

      if (currentCount >= maxRequests) {
        socketLogger.warn(`Rate limit exceeded for user ${userId}`);
        socketMetrics.incrementRateLimitExceeded();
        return next(createSocketError(SocketErrorCode.RATE_LIMIT_EXCEEDED, 'Rate limit exceeded'));
      }

      await redisService.setSocketData(key, currentCount + 1, Math.ceil(windowMs / 1000));
      socketMetrics.incrementRateLimitRequest();
      next();
    } catch (error) {
      socketLogger.error('Error in rate limit middleware', error);
      next(createSocketError(SocketErrorCode.INTERNAL_ERROR, 'Internal server error'));
    }
  };
};

/**
 * Rate limits individual socket events based on event name and configuration
 * @param {ISocketUser} socket - Socket instance with user information
 * @param {string} eventName - Name of the event being rate limited
 * @param {RateLimitConfig} config - Rate limit configuration for the event
 * @returns {Promise<boolean>} Whether the event is allowed
 */
export const rateLimitEvent = async (
  socket: ISocketUser,
  eventName: string,
  config: RateLimitConfig
): Promise<boolean> => {
  const { windowMs, maxRequests, keyPrefix } = config;
  const userId = socket.user?.id;

  if (!userId) {
    throw createSocketError(SocketErrorCode.UNAUTHORIZED, 'User not authenticated');
  }

  const key = `${keyPrefix}${userId}:${eventName}`;
  const currentCount = await redisService.getSocketData(key) || 0;

  if (currentCount >= maxRequests) {
    socketLogger.warn(`Event rate limit exceeded for user ${userId} on event ${eventName}`);
    socketMetrics.incrementEventRateLimitExceeded(eventName);
    return false;
  }

  await redisService.setSocketData(key, currentCount + 1, Math.ceil(windowMs / 1000));
  socketMetrics.incrementEventRateLimitRequest(eventName);
  return true;
};

// Export default configuration
export const defaultRateLimitConfig: RateLimitConfig = {
  windowMs: DEFAULT_WINDOW_MS,
  maxRequests: DEFAULT_MAX_REQUESTS,
  keyPrefix: DEFAULT_KEY_PREFIX,
};