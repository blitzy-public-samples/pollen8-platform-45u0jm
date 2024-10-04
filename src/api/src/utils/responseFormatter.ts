import { Response } from 'express';
import { ApiResponse } from '../../shared/types/api.types';

/**
 * HTTP status codes enum
 * @description Defines common HTTP status codes used in API responses
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * Formats a successful API response with consistent structure.
 * @description Ensures a standardized format for all successful API responses
 * @param data - The data to be included in the response
 * @param message - An optional message to be included in the response
 * @returns A formatted success response object
 * @requirements User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 * @requirements API Standardization (Technical Specification/2.3.2 Backend Components/APIGateway)
 */
export function formatSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message: message || 'Operation successful',
  };
}

/**
 * Formats an error API response with consistent structure and appropriate status code.
 * @description Ensures a standardized format for all error API responses
 * @param error - The error object or error message
 * @param statusCode - The HTTP status code for the error
 * @returns A formatted error response object
 * @requirements User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 * @requirements API Standardization (Technical Specification/2.3.2 Backend Components/APIGateway)
 */
export function formatErrorResponse(error: Error | string, statusCode: HttpStatus): ApiResponse<null> {
  const errorMessage = error instanceof Error ? error.message : error;
  return {
    success: false,
    data: null,
    error: errorMessage,
  };
}

/**
 * Formats a validation error response for invalid request data.
 * @description Provides a consistent format for validation errors in API responses
 * @param errors - An array of validation error messages
 * @returns A formatted validation error response object
 * @requirements User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 * @requirements API Standardization (Technical Specification/2.3.2 Backend Components/APIGateway)
 */
export function formatValidationErrorResponse(errors: string[]): ApiResponse<null> {
  return {
    success: false,
    data: null,
    error: 'Validation failed',
    errors,
  };
}

/**
 * Sends a formatted API response
 * @description Utility function to send a formatted response using Express Response object
 * @param res - Express Response object
 * @param statusCode - HTTP status code
 * @param data - Response data
 * @requirements User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 * @requirements API Standardization (Technical Specification/2.3.2 Backend Components/APIGateway)
 */
export function sendResponse<T>(res: Response, statusCode: HttpStatus, data: ApiResponse<T>): void {
  res.status(statusCode).json(data);
}

/**
 * @fileoverview This module provides utility functions for formatting API responses
 * in a consistent manner across the Pollen8 API. It ensures that all responses
 * follow a standardized structure, improving the user experience and making
 * it easier for frontend developers to work with the API.
 *
 * The module addresses the following requirements:
 * 1. User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 *    - By providing consistent and user-friendly API responses
 * 2. API Standardization (Technical Specification/2.3.2 Backend Components/APIGateway)
 *    - By implementing a standardized response structure for all API endpoints
 *
 * Usage:
 * import { formatSuccessResponse, formatErrorResponse, sendResponse, HttpStatus } from './responseFormatter';
 *
 * // In your controller:
 * const userData = await userService.getUserProfile(userId);
 * const response = formatSuccessResponse(userData, 'User profile retrieved successfully');
 * sendResponse(res, HttpStatus.OK, response);
 *
 * // For error handling:
 * const errorResponse = formatErrorResponse('User not found', HttpStatus.NOT_FOUND);
 * sendResponse(res, HttpStatus.NOT_FOUND, errorResponse);
 */