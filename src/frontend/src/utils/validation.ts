import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { IUser } from '@shared/interfaces/user.interface';
import { ValidationErrors, ERROR_MESSAGES } from '@shared/constants/errorCodes';

// Global constants
const MINIMUM_INDUSTRIES = 3;
const MINIMUM_INTERESTS = 3;
const ZIP_CODE_REGEX = /^\d{5}(-\d{4})?$/;

/**
 * Standardized interface for validation function results
 */
interface ValidationResult {
  isValid: boolean;
  error?: string;
  formattedValue?: string;
}

/**
 * Validates and formats phone numbers using libphonenumber-js
 * @param phoneNumber The phone number to validate
 * @returns ValidationResult object containing validation result
 */
export function validatePhoneNumber(phoneNumber: string): ValidationResult {
  try {
    if (!isValidPhoneNumber(phoneNumber, 'US')) {
      return {
        isValid: false,
        error: ERROR_MESSAGES[ValidationErrors.INVALID_PHONE],
      };
    }

    const parsedNumber = parsePhoneNumber(phoneNumber, 'US');
    return {
      isValid: true,
      formattedValue: parsedNumber.format('NATIONAL'),
    };
  } catch (error) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[ValidationErrors.INVALID_PHONE],
    };
  }
}

/**
 * Ensures the user has selected the minimum required number of industries
 * @param industries Array of selected industry IDs
 * @returns ValidationResult object containing validation result
 */
export function validateIndustries(industries: string[]): ValidationResult {
  if (industries.length < MINIMUM_INDUSTRIES) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[ValidationErrors.INSUFFICIENT_INDUSTRIES],
    };
  }

  // Check for duplicate selections
  const uniqueIndustries = new Set(industries);
  if (uniqueIndustries.size !== industries.length) {
    return {
      isValid: false,
      error: 'Duplicate industry selections are not allowed.',
    };
  }

  return { isValid: true };
}

/**
 * Ensures the user has selected the minimum required number of interests
 * @param interests Array of selected interest IDs
 * @returns ValidationResult object containing validation result
 */
export function validateInterests(interests: string[]): ValidationResult {
  if (interests.length < MINIMUM_INTERESTS) {
    return {
      isValid: false,
      error: ERROR_MESSAGES[ValidationErrors.INSUFFICIENT_INTERESTS],
    };
  }

  // Check for duplicate selections
  const uniqueInterests = new Set(interests);
  if (uniqueInterests.size !== interests.length) {
    return {
      isValid: false,
      error: 'Duplicate interest selections are not allowed.',
    };
  }

  return { isValid: true };
}

/**
 * Validates US ZIP codes using regex pattern
 * @param zipCode The ZIP code to validate
 * @returns ValidationResult object containing validation result
 */
export function validateZipCode(zipCode: string): ValidationResult {
  if (!ZIP_CODE_REGEX.test(zipCode)) {
    return {
      isValid: false,
      error: 'Invalid ZIP code format. Please use 12345 or 12345-6789.',
    };
  }
  return { isValid: true };
}

/**
 * Comprehensive validation for user profile data
 * @param userData Partial user data to validate
 * @returns ValidationResult object containing validation result
 */
export function validateProfileCompletion(userData: Partial<IUser>): ValidationResult {
  const errors: string[] = [];

  // Validate phone number if present
  if (userData.phoneNumber) {
    const phoneResult = validatePhoneNumber(userData.phoneNumber);
    if (!phoneResult.isValid) {
      errors.push(phoneResult.error!);
    }
  }

  // Validate industries if present
  if (userData.industries) {
    const industriesResult = validateIndustries(userData.industries.map(i => i._id.toString()));
    if (!industriesResult.isValid) {
      errors.push(industriesResult.error!);
    }
  }

  // Validate interests if present
  if (userData.interests) {
    const interestsResult = validateInterests(userData.interests.map(i => i._id.toString()));
    if (!interestsResult.isValid) {
      errors.push(interestsResult.error!);
    }
  }

  // Validate ZIP code if present
  if (userData.location?.zipCode) {
    const zipResult = validateZipCode(userData.location.zipCode);
    if (!zipResult.isValid) {
      errors.push(zipResult.error!);
    }
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: errors.join(' '),
    };
  }

  return { isValid: true };
}

/**
 * @fileoverview This utility module provides frontend validation functions for user input in the Pollen8 platform,
 * ensuring data integrity before API calls and enhancing user experience with immediate feedback.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives): Validate phone numbers on frontend before API calls
 * - Industry Focus (Technical Specification/1.2 Scope/Limitations and Constraints): Ensure minimum industry selection requirement
 * - User-Centric Design (Technical Specification/1.1 System Objectives): Provide immediate validation feedback
 */