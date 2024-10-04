/**
 * errorCodes.ts
 * 
 * This file defines all error codes and messages used throughout the Pollen8 platform,
 * ensuring consistent error handling and reporting across frontend and backend services.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives): Error codes for phone verification failures
 * - User-Centric Design (Technical Specification/1.1 System Objectives): Standardized error messages for better UX
 * - Data Integrity (Technical Specification/2.5 Security Protocols): Error codes for validation failures
 */

// Authentication-related error codes
export enum AuthErrors {
  INVALID_PHONE = 'AUTH001',
  VERIFICATION_FAILED = 'AUTH002',
  SESSION_EXPIRED = 'AUTH003',
}

// Data validation error codes
export enum ValidationErrors {
  MISSING_REQUIRED = 'VAL001',
  INVALID_INDUSTRY = 'VAL002',
  INSUFFICIENT_INDUSTRIES = 'VAL003',
  INVALID_INTEREST = 'VAL004',
  INSUFFICIENT_INTERESTS = 'VAL005',
}

// Network and connection error codes
export enum NetworkErrors {
  CONNECTION_FAILED = 'NET001',
  INVALID_CONNECTION = 'NET002',
}

// Invitation-related error codes
export enum InviteErrors {
  INVALID_INVITE = 'INV001',
  EXPIRED_INVITE = 'INV002',
}

// General system error codes
export enum SystemErrors {
  INTERNAL_ERROR = 'SYS001',
  SERVICE_UNAVAILABLE = 'SYS002',
}

// Union type of all possible error codes
export type ErrorCode = AuthErrors | ValidationErrors | NetworkErrors | InviteErrors | SystemErrors;

// Error messages corresponding to each error code
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Auth errors
  [AuthErrors.INVALID_PHONE]: 'The provided phone number is invalid.',
  [AuthErrors.VERIFICATION_FAILED]: 'Phone number verification failed. Please try again.',
  [AuthErrors.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',

  // Validation errors
  [ValidationErrors.MISSING_REQUIRED]: 'Required field is missing.',
  [ValidationErrors.INVALID_INDUSTRY]: 'The selected industry is not valid.',
  [ValidationErrors.INSUFFICIENT_INDUSTRIES]: 'Please select at least three industries.',
  [ValidationErrors.INVALID_INTEREST]: 'The selected interest is not valid.',
  [ValidationErrors.INSUFFICIENT_INTERESTS]: 'Please select at least three interests.',

  // Network errors
  [NetworkErrors.CONNECTION_FAILED]: 'Failed to establish connection. Please check your network.',
  [NetworkErrors.INVALID_CONNECTION]: 'The connection request is invalid or unauthorized.',

  // Invite errors
  [InviteErrors.INVALID_INVITE]: 'The invite code is invalid or has already been used.',
  [InviteErrors.EXPIRED_INVITE]: 'This invite has expired.',

  // System errors
  [SystemErrors.INTERNAL_ERROR]: 'An internal error occurred. Please try again later.',
  [SystemErrors.SERVICE_UNAVAILABLE]: 'The service is currently unavailable. Please try again later.',
};

/**
 * Helper function to get the error message for a given error code
 * @param code The error code
 * @returns The corresponding error message
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || 'An unknown error occurred.';
}