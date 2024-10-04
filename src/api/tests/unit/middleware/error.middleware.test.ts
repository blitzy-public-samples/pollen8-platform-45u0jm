import { Request, Response, NextFunction } from 'express';
import { errorHandler, ApiError } from '../../../src/middleware/error.middleware';
import { ERROR_CODES } from '@shared/constants/errorCodes';
import { logApiError } from '../../../src/utils/apiLogger';
import { HttpStatus } from '../../../src/utils/responseFormatter';

// Mock the logApiError function
jest.mock('../../../src/utils/apiLogger', () => ({
  logApiError: jest.fn(),
}));

describe('errorHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      app: {
        locals: {
          logger: {
            error: jest.fn(),
          },
        },
      },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should handle ApiError correctly', () => {
    const apiError = new ApiError('Test error', HttpStatus.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
    errorHandler(apiError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(logApiError).toHaveBeenCalledWith(mockRequest.app.locals.logger, apiError, mockRequest);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Test error',
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ERROR_CODES.VALIDATION_ERROR,
    });
  });

  test('should handle ValidationError correctly', () => {
    const validationError = new Error('Field1 is required, Field2 is invalid');
    validationError.name = 'ValidationError';
    errorHandler(validationError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(logApiError).toHaveBeenCalledWith(mockRequest.app.locals.logger, validationError, mockRequest);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Validation failed',
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ERROR_CODES.VALIDATION_ERROR,
      errors: ['Field1 is required', 'Field2 is invalid'],
    });
  });

  test('should handle UnauthorizedError correctly', () => {
    const unauthorizedError = new Error('Authentication failed');
    unauthorizedError.name = 'UnauthorizedError';
    errorHandler(unauthorizedError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(logApiError).toHaveBeenCalledWith(mockRequest.app.locals.logger, unauthorizedError, mockRequest);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Authentication failed',
      statusCode: HttpStatus.UNAUTHORIZED,
      errorCode: ERROR_CODES.UNAUTHORIZED,
    });
  });

  test('should handle unknown errors correctly', () => {
    const unknownError = new Error('Unknown error');
    errorHandler(unknownError, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(logApiError).toHaveBeenCalledWith(mockRequest.app.locals.logger, unknownError, mockRequest);
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'An unexpected error occurred',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
  });
});

describe('ApiError class', () => {
  test('should create ApiError instance correctly', () => {
    const message = 'Test API error';
    const statusCode = HttpStatus.BAD_REQUEST;
    const errorCode = ERROR_CODES.VALIDATION_ERROR;

    const apiError = new ApiError(message, statusCode, errorCode);

    expect(apiError).toBeInstanceOf(Error);
    expect(apiError).toBeInstanceOf(ApiError);
    expect(apiError.message).toBe(message);
    expect(apiError.statusCode).toBe(statusCode);
    expect(apiError.errorCode).toBe(errorCode);
  });
});