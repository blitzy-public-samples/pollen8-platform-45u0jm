import winston from 'winston';
import morgan from 'morgan';
import { Request } from 'express';
import { formatSuccessResponse, formatErrorResponse } from './responseFormatter';

/**
 * Defines log levels for the API logger
 * @description Specifies the hierarchy of log levels used in the application
 * @requirements Monitoring (Technical Specification/2.2 High-Level Architecture Diagram/Supporting Services)
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

/**
 * Interface for API logger options
 * @description Defines the configuration options for the API logger
 */
interface ApiLoggerOptions {
  level: string;
  format: winston.Logform.Format;
  transports: winston.transport[];
}

/**
 * Creates and configures a Winston logger instance specifically for API logging.
 * @description Sets up a logger with appropriate configuration for API-specific logging
 * @param options - Configuration options for the logger
 * @returns Configured Winston logger instance
 * @requirements Monitoring (Technical Specification/2.2 High-Level Architecture Diagram/Supporting Services)
 */
export function createApiLogger(options: ApiLoggerOptions): winston.Logger {
  const defaultOptions: ApiLoggerOptions = {
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [new winston.transports.Console()]
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return winston.createLogger(mergedOptions);
}

/**
 * Creates an Express middleware for logging HTTP requests using morgan, integrated with the Winston logger.
 * @description Configures morgan to log HTTP requests and integrates it with the Winston logger
 * @param logger - Winston logger instance
 * @returns Express middleware for request logging
 * @requirements Monitoring (Technical Specification/2.2 High-Level Architecture Diagram/Supporting Services)
 * @requirements Security Logging (Technical Specification/5.3.2 Monitoring and Incident Response)
 */
export function createRequestLogger(logger: winston.Logger): morgan.Handler {
  const stream = {
    write: (message: string) => {
      logger.info(message.trim());
    }
  };

  return morgan('combined', { stream });
}

/**
 * Logs API-specific errors with contextual information.
 * @description Enhances error logging with request-specific context
 * @param logger - Winston logger instance
 * @param error - Error object or error message
 * @param request - Express Request object
 * @requirements Monitoring (Technical Specification/2.2 High-Level Architecture Diagram/Supporting Services)
 * @requirements Security Logging (Technical Specification/5.3.2 Monitoring and Incident Response)
 */
export function logApiError(logger: winston.Logger, error: Error | string, request: Request): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorContext = {
    method: request.method,
    url: request.url,
    ip: request.ip,
    userId: request.user?.id || 'unauthenticated'
  };

  const formattedError = formatErrorResponse(errorMessage, 500);
  logger.error('API Error', { ...formattedError, context: errorContext });
}

/**
 * Logs successful API operations with relevant details.
 * @description Provides detailed logging for successful API operations
 * @param logger - Winston logger instance
 * @param message - Success message
 * @param request - Express Request object
 * @param data - Optional data to be logged
 * @requirements Monitoring (Technical Specification/2.2 High-Level Architecture Diagram/Supporting Services)
 */
export function logApiSuccess(logger: winston.Logger, message: string, request: Request, data?: any): void {
  const successContext = {
    method: request.method,
    url: request.url,
    ip: request.ip,
    userId: request.user?.id || 'unauthenticated'
  };

  const formattedSuccess = formatSuccessResponse(data, message);
  logger.info('API Success', { ...formattedSuccess, context: successContext });
}

/**
 * @fileoverview This module provides API-specific logging functionality for the Pollen8 platform.
 * It focuses on HTTP request/response logging and API-specific events, addressing the following requirements:
 * 
 * 1. Monitoring (Technical Specification/2.2 High-Level Architecture Diagram/Supporting Services)
 *    - Enables tracking and debugging of API interactions
 * 2. Security Logging (Technical Specification/5.3.2 Monitoring and Incident Response)
 *    - Supports audit trails for security events
 * 
 * The module integrates Winston for core logging functionality and Morgan for HTTP request logging.
 * It provides functions to create a configured logger, set up request logging middleware,
 * and log API-specific errors and successes with contextual information.
 * 
 * Usage:
 * import { createApiLogger, createRequestLogger, logApiError, logApiSuccess } from './apiLogger';
 * 
 * // Create and configure the logger
 * const logger = createApiLogger({ level: 'debug' });
 * 
 * // Set up request logging middleware
 * app.use(createRequestLogger(logger));
 * 
 * // Log API errors
 * logApiError(logger, new Error('User not found'), req);
 * 
 * // Log API successes
 * logApiSuccess(logger, 'User profile updated', req, { userId: '123' });
 */