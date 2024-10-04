import { ErrorCode, ERROR_MESSAGES, getErrorMessage } from '@shared/constants/errorCodes';
import { config } from '../config';

/**
 * Custom error class that extends the native Error class.
 * This class is used to create standardized error objects across the Pollen8 platform.
 * 
 * Requirements addressed:
 * - User-Centric Design (Technical Specification/1.1 System Objectives)
 * - Security Monitoring (Technical Specification/5.3.2 Monitoring and Incident Response)
 * - Data Integrity (Technical Specification/2.5 Security Protocols)
 */
export class BaseError extends Error {
  statusCode: number;
  errorCode: ErrorCode;
  isOperational: boolean;

  constructor(message: string, statusCode: number, errorCode: ErrorCode, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Specific error class for validation errors.
 */
export class ValidationError extends BaseError {
  constructor(message: string, errorCode: ErrorCode) {
    super(message, 400, errorCode, true);
  }
}

/**
 * Central error handling function that processes and logs errors appropriately.
 * 
 * @param err - The error object to be handled
 */
export const handleError = (err: Error | BaseError): void => {
  if (isOperationalError(err)) {
    logError(err);
  } else {
    logErrorStack(err);
    // If the error is not operational, we might want to do more drastic things in production
    if (config.NODE_ENV === 'production') {
      // TODO: Implement production-specific error handling (e.g., restart process)
    } else {
      throw err; // In development, we want to see the full error
    }
  }
};

/**
 * Determines if an error is operational (expected) or programming (unexpected).
 * 
 * @param error - The error to be checked
 * @returns True if the error is operational, false otherwise
 */
export const isOperationalError = (error: Error | BaseError): boolean => {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Logs the error details using the appropriate logging level.
 * 
 * @param err - The error to be logged
 */
const logError = (err: Error | BaseError): void => {
  // TODO: Implement proper logging once logger is available
  console.error(`Error: ${err.message}`);
  if (err instanceof BaseError) {
    console.error(`Error Code: ${err.errorCode}`);
    console.error(`Status Code: ${err.statusCode}`);
  }
};

/**
 * Logs the full error stack trace for debugging purposes.
 * 
 * @param err - The error whose stack trace should be logged
 */
export const logErrorStack = (err: Error | BaseError): void => {
  // TODO: Implement proper logging once logger is available
  console.error('Error stack:', err.stack);
};

/**
 * Creates a new error instance with the appropriate type and message.
 * 
 * @param errorCode - The error code to use
 * @param statusCode - The HTTP status code to associate with the error
 * @returns A new BaseError instance
 */
export const createError = (errorCode: ErrorCode, statusCode: number): BaseError => {
  const message = getErrorMessage(errorCode);
  return new BaseError(message, statusCode, errorCode);
};

/**
 * Utility function to create a validation error.
 * 
 * @param errorCode - The specific validation error code
 * @returns A new ValidationError instance
 */
export const createValidationError = (errorCode: ErrorCode): ValidationError => {
  const message = getErrorMessage(errorCode);
  return new ValidationError(message, errorCode);
};

/**
 * This module provides standardized error handling functions and custom error classes
 * for the backend service of the Pollen8 platform.
 * 
 * It addresses the following requirements:
 * 1. User-Centric Design (Technical Specification/1.1 System Objectives)
 *    - Ensures consistent, user-friendly error messages
 * 2. Security Monitoring (Technical Specification/5.3.2 Monitoring and Incident Response)
 *    - Facilitates error logging for monitoring
 * 3. Data Integrity (Technical Specification/2.5 Security Protocols)
 *    - Handles and reports validation errors effectively
 * 
 * The module includes:
 * - Custom error classes (BaseError, ValidationError)
 * - Error handling and logging functions
 * - Utility functions for creating standardized errors
 */