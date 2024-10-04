import { Request, Response, NextFunction, RequestHandler } from 'express';
import rateLimit, { Options as RateLimitOptions, Store } from 'express-rate-limit';
import { RedisClientType } from 'redis';
import { apiLogger } from '../utils/apiLogger';
import { ApiError, HttpStatus } from '../utils/responseFormatter';

// Constants for rate limiting
const DEFAULT_WINDOW_MS = 60000; // 1 minute
const DEFAULT_MAX_REQUESTS = 100;
const RATE_LIMIT_EXCEEDED_CODE = 'TOO_MANY_REQUESTS';
const RATE_LIMIT_EXCEEDED_MESSAGE = 'Too many requests, please try again later.';

/**
 * Interface for rate limiter options
 */
interface RateLimiterOptions extends Partial<RateLimitOptions> {
  redisClient?: RedisClientType;
}

/**
 * Redis store for rate limiting data
 */
class RedisStore implements Store {
  private redisClient: RedisClientType;
  private prefix: string;

  constructor(redisClient: RedisClientType, prefix: string = 'rl:') {
    this.redisClient = redisClient;
    this.prefix = prefix;
  }

  /**
   * Increments the request count for a given key
   * @param key - The rate limiting key (usually IP address)
   * @returns Updated rate limit information
   */
  async increment(key: string): Promise<RateLimitInfo> {
    const redisKey = this.prefix + key;
    const [count] = await Promise.all([
      this.redisClient.incr(redisKey),
      this.redisClient.pexpire(redisKey, DEFAULT_WINDOW_MS),
    ]);
    return {
      totalHits: count,
      resetTime: Date.now() + DEFAULT_WINDOW_MS,
    };
  }

  /**
   * Decrements the request count for a given key
   * @param key - The rate limiting key (usually IP address)
   */
  async decrement(key: string): Promise<void> {
    const redisKey = this.prefix + key;
    await this.redisClient.decr(redisKey);
  }
}

/**
 * Creates a rate limiter middleware instance with configurable options
 * @param options - Rate limiter options
 * @returns Express middleware for rate limiting
 */
export function createRateLimiter(options: RateLimiterOptions = {}): RequestHandler {
  const {
    windowMs = DEFAULT_WINDOW_MS,
    max = DEFAULT_MAX_REQUESTS,
    redisClient,
    ...restOptions
  } = options;

  const store = redisClient ? new RedisStore(redisClient) : undefined;

  const rateLimiterOptions: RateLimitOptions = {
    windowMs,
    max,
    store,
    handler: handleRateLimitExceeded,
    ...restOptions,
  };

  return rateLimit(rateLimiterOptions);
}

/**
 * Handles cases where a client has exceeded their rate limit
 * @param req - Express Request object
 * @param res - Express Response object
 */
function handleRateLimitExceeded(req: Request, res: Response): void {
  apiLogger.warn(`Rate limit exceeded for IP: ${req.ip}`, {
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
  });

  const error = new ApiError(
    RATE_LIMIT_EXCEEDED_MESSAGE,
    HttpStatus.TOO_MANY_REQUESTS,
    RATE_LIMIT_EXCEEDED_CODE
  );

  res.status(HttpStatus.TOO_MANY_REQUESTS).json(error.toJSON());
}

/**
 * @fileoverview This module implements rate limiting functionality for the Pollen8 API
 * to prevent abuse and ensure fair usage of resources. It uses the express-rate-limit
 * package with an optional Redis store for distributed rate limiting.
 *
 * The module addresses the following requirements:
 * 1. API Security (Technical Specification/5.3.1 API Security)
 *    - Prevents API abuse through rate limiting
 * 2. Performance (Technical Specification/8.1.2 Performance Benchmarks)
 *    - Ensures system stability by controlling request rates
 *
 * Usage:
 * import { createRateLimiter } from './middleware/rateLimiter.middleware';
 *
 * // In your Express app setup:
 * const rateLimiter = createRateLimiter({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   max: 100, // limit each IP to 100 requests per windowMs
 *   redisClient: redisClient, // optional, for distributed rate limiting
 * });
 *
 * app.use(rateLimiter);
 */