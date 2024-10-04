import { IInviteCreate, IInviteUpdate } from '../interfaces/invite.interface';
import { InviteErrors, ValidationErrors, ERROR_MESSAGES } from '../constants/errorCodes';

/**
 * Type definition for validation result
 */
export type ValidationResult = {
  isValid: boolean;
  errors?: InviteErrors[] | ValidationErrors[];
};

/**
 * Validates data for creating a new invite link.
 * 
 * Requirements addressed:
 * - Invitation System (Technical Specification/1.2 Scope/Core Functionalities/3)
 * - Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 * - User-Centric Design (Technical Specification/1.1 System Objectives)
 * 
 * @param inviteData The data to be validated for invite creation
 * @returns ValidationResult indicating if the data is valid and any errors
 */
export function validateInviteCreate(inviteData: IInviteCreate): ValidationResult {
  const errors: (InviteErrors | ValidationErrors)[] = [];

  // Check if inviteData contains required fields
  if (!inviteData.userId) {
    errors.push(ValidationErrors.MISSING_REQUIRED);
  }

  if (!inviteData.name) {
    errors.push(ValidationErrors.MISSING_REQUIRED);
  } else {
    // Validate invite name length (1-50 characters)
    if (inviteData.name.length < 1 || inviteData.name.length > 50) {
      errors.push(InviteErrors.INVALID_INVITE);
    }

    // Validate invite name contains only alphanumeric characters and spaces
    if (!/^[a-zA-Z0-9 ]+$/.test(inviteData.name)) {
      errors.push(InviteErrors.INVALID_INVITE);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Validates data for updating an existing invite.
 * 
 * Requirements addressed:
 * - Invitation System (Technical Specification/1.2 Scope/Core Functionalities/3)
 * - Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 * - User-Centric Design (Technical Specification/1.1 System Objectives)
 * 
 * @param updateData The data to be validated for invite update
 * @returns ValidationResult indicating if the data is valid and any errors
 */
export function validateInviteUpdate(updateData: IInviteUpdate): ValidationResult {
  const errors: (InviteErrors | ValidationErrors)[] = [];

  // Check which fields are being updated
  if (updateData.name !== undefined) {
    // Validate invite name length (1-50 characters)
    if (updateData.name.length < 1 || updateData.name.length > 50) {
      errors.push(InviteErrors.INVALID_INVITE);
    }

    // Validate invite name contains only alphanumeric characters and spaces
    if (!/^[a-zA-Z0-9 ]+$/.test(updateData.name)) {
      errors.push(InviteErrors.INVALID_INVITE);
    }
  }

  if (updateData.isActive !== undefined) {
    // Ensure isActive is a boolean
    if (typeof updateData.isActive !== 'boolean') {
      errors.push(ValidationErrors.MISSING_REQUIRED);
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Validates an invite code format and existence.
 * 
 * Requirements addressed:
 * - Invitation System (Technical Specification/1.2 Scope/Core Functionalities/3)
 * - Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 * - User-Centric Design (Technical Specification/1.1 System Objectives)
 * 
 * @param code The invite code to be validated
 * @returns ValidationResult indicating if the code is valid and any errors
 */
export function validateInviteCode(code: string): ValidationResult {
  const errors: InviteErrors[] = [];

  // Check if code is exactly 8 characters long
  if (code.length !== 8) {
    errors.push(InviteErrors.INVALID_INVITE);
  }

  // Validate code contains only URL-friendly characters (alphanumeric)
  if (!/^[a-zA-Z0-9]+$/.test(code)) {
    errors.push(InviteErrors.INVALID_INVITE);
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Helper function to get error messages for invite validation errors
 * 
 * @param errors Array of error codes
 * @returns Array of error messages
 */
export function getInviteErrorMessages(errors: (InviteErrors | ValidationErrors)[]): string[] {
  return errors.map(error => ERROR_MESSAGES[error]);
}

/**
 * @fileoverview This module provides validation functions for invite-related operations in the Pollen8 platform.
 * It ensures data integrity and consistent validation logic for invite creation and updates.
 * 
 * Key features:
 * 1. Strict validation for invite creation data
 * 2. Flexible validation for invite updates
 * 3. Invite code format validation
 * 4. Error message retrieval for user-friendly feedback
 * 
 * This module addresses the following requirements:
 * - Invitation System (Technical Specification/1.2 Scope/Core Functionalities/3)
 * - Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 * - User-Centric Design (Technical Specification/1.1 System Objectives)
 * 
 * Usage:
 * import { validateInviteCreate, validateInviteUpdate, validateInviteCode, getInviteErrorMessages } from './invite.validator';
 * 
 * const createResult = validateInviteCreate(inviteData);
 * if (!createResult.isValid) {
 *   const errorMessages = getInviteErrorMessages(createResult.errors);
 *   // Handle validation errors
 * }
 */