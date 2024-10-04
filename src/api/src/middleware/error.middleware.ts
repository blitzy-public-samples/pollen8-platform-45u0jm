import { Request, Response, NextFunction } from 'express';
import { formatErrorResponse, HttpStatus, sendResponse } from '../utils/responseFormatter';
import { logApiError } from '../utils/apiLogger';
import { ERROR_CODES } from '@shared/constants/errorCodes';

/**
 * Custom error class for API-specific errors with additional properties
 * @description Extends the built-in Error class to include statusCode and errorCode
 * @requirements User-Centric Design (Technical Specification/1.1 System Objectives)
 * @requirements API Standardization (Technical Specification/2.3.2 Backend Components/APIGateway)
 */
export class ApiError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(message: string, statusCode: number, errorCode: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Express middleware function that handles all errors thrown during request processing
 * @description Centralizes error handling for consistent error responses and logging
 * @param err - Error object caught by Express
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 * @returns void
 * @requirements User-Centric Design (Technical Specification/1.1 System Objectives)
 * @requirements Security Monitoring (Technical Specification/5.3.2 Monitoring and Incident Response)
 * @requirements API Standardization (Technical Specification/2.3.2 Backend Components/APIGateway)
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log the error for monitoring and debugging
  logApiError(req.app.locals.logger, err, req);

  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR;
  let errorMessage = 'An unexpected error occurred';

  // Check if the error is an instance of ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    errorMessage = err.message;
  } else if (err.name === 'ValidationError') {
    // Handle validation errors specifically
    statusCode = HttpStatus.BAD_REQUEST;
    errorCode = ERROR_CODES.VALIDATION_ERROR;
    errorMessage = 'Validation failed';
    // If it's a validation error, we might have more details in the error object
    const validationErrors = err.message.split(',').map(e => e.trim());
    const errorResponse = formatErrorResponse(errorMessage, statusCode);
    errorResponse.errors = validationErrors;
    errorResponse.errorCode = errorCode;
    return sendResponse(res, statusCode, errorResponse);
  } else if (err.name === 'UnauthorizedError') {
    // Handle authentication errors
    statusCode = HttpStatus.UNAUTHORIZED;
    errorCode = ERROR_CODES.UNAUTHORIZED;
    errorMessage = 'Authentication failed';
  }

  // Format and send the error response
  const errorResponse = formatErrorResponse(errorMessage, statusCode);
  errorResponse.errorCode = errorCode;
  sendResponse(res, statusCode, errorResponse);
};

/**
 * @fileoverview This module provides centralized error handling for the Pollen8 API.
 * It ensures consistent error responses and logging across all endpoints, addressing
 * the following requirements:
 * 
 * 1. User-Centric Design (Technical Specification/1.1 System Objectives)
 *    - Provides clear, consistent error messages to improve user experience
 * 2. Security Monitoring (Technical Specification/5.3.2 Monitoring and Incident Response)
 *    - Logs errors for monitoring and debugging purposes
 * 3. API Standardization (Technical Specification/2.3.2 Backend Components/APIGateway)
 *    - Ensures consistent error response format across all API endpoints
 * 
 * The module exports an ApiError class for creating custom API errors and an errorHandler
 * middleware function for processing and responding to errors.
 * 
 * Usage:
 * import { errorHandler, ApiError } from './middleware/error.middleware';
 * 
 * // In your Express app setup:
 * app.use(errorHandler);
 * 
 * // In your route handlers or services:
 * throw new ApiError('User not found', HttpStatus.NOT_FOUND, ERROR_CODES.USER_NOT_FOUND);
 */