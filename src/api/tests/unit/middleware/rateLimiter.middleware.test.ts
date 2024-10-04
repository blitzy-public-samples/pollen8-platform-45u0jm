import { Request, Response, NextFunction } from 'express';
import { createRateLimiter } from '../../../src/middleware/rateLimiter.middleware';
import { ApiError } from '../../../src/utils/responseFormatter';
import RedisMock from 'redis-mock';
import { RedisClientType } from 'redis';

// Constants for testing
const TEST_ROUTE = '/test';
const DEFAULT_TEST_WINDOW = 60000; // 1 minute
const DEFAULT_TEST_MAX_REQUESTS = 5;

// Mock Redis client
const mockRedisClient = new RedisMock.createClient() as unknown as RedisClientType;

// Mock Express app
const createTestServer = (options: any = {}) => {
  const rateLimiter = createRateLimiter({
    windowMs: DEFAULT_TEST_WINDOW,
    max: DEFAULT_TEST_MAX_REQUESTS,
    ...options,
  });

  return {
    use: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    rateLimiter,
  };
};

// Mock request, response, and next function
const mockRequest = () => ({
  ip: '127.0.0.1',
  method: 'GET',
  originalUrl: TEST_ROUTE,
  headers: {},
}) as Request;

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

const mockNext: NextFunction = jest.fn();

describe('rateLimiter Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow requests within rate limit', async () => {
    const app = createTestServer();
    const req = mockRequest();
    const res = mockResponse();

    for (let i = 0; i < DEFAULT_TEST_MAX_REQUESTS; i++) {
      await app.rateLimiter(req, res, mockNext);
    }

    expect(mockNext).toHaveBeenCalledTimes(DEFAULT_TEST_MAX_REQUESTS);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('should block requests exceeding rate limit', async () => {
    const app = createTestServer();
    const req = mockRequest();
    const res = mockResponse();

    for (let i = 0; i < DEFAULT_TEST_MAX_REQUESTS; i++) {
      await app.rateLimiter(req, res, mockNext);
    }

    // This request should be blocked
    await app.rateLimiter(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(DEFAULT_TEST_MAX_REQUESTS);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Too many requests, please try again later.',
      statusCode: 429,
      errorCode: 'TOO_MANY_REQUESTS',
    }));
  });

  it('should respect custom window and max requests', async () => {
    const customWindow = 30000; // 30 seconds
    const customMaxRequests = 3;
    const app = createTestServer({ windowMs: customWindow, max: customMaxRequests });
    const req = mockRequest();
    const res = mockResponse();

    for (let i = 0; i < customMaxRequests; i++) {
      await app.rateLimiter(req, res, mockNext);
    }

    // This request should be blocked
    await app.rateLimiter(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(customMaxRequests);
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('should use Redis store when configured', async () => {
    const app = createTestServer({ redisClient: mockRedisClient });
    const req = mockRequest();
    const res = mockResponse();

    const incrSpy = jest.spyOn(mockRedisClient, 'incr');
    const pexpireSpy = jest.spyOn(mockRedisClient, 'pexpire');

    await app.rateLimiter(req, res, mockNext);

    expect(incrSpy).toHaveBeenCalled();
    expect(pexpireSpy).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle custom error message', async () => {
    const customErrorMessage = 'Custom rate limit exceeded message';
    const app = createTestServer({
      max: 1,
      message: customErrorMessage,
    });
    const req = mockRequest();
    const res = mockResponse();

    await app.rateLimiter(req, res, mockNext);
    await app.rateLimiter(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: customErrorMessage,
    }));
  });
});