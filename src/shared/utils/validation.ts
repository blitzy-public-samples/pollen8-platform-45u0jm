import { IUserCreate, IUserUpdate, ILocation } from '../interfaces/user.interface';
import { ValidationErrors, ERROR_MESSAGES } from '../constants/errorCodes';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

/**
 * Validates a phone number using the libphonenumber-js library.
 * @param phoneNumber The phone number to validate
 * @returns An object indicating validity and any error
 */
export function validatePhoneNumber(phoneNumber: string): { isValid: boolean; error?: ValidationErrors } {
  try {
    const parsedNumber = parsePhoneNumber(phoneNumber);
    if (parsedNumber && isValidPhoneNumber(phoneNumber)) {
      return { isValid: true };
    }
  } catch (error) {
    console.error('Phone number parsing error:', error);
  }
  return { isValid: false, error: ValidationErrors.INVALID_PHONE };
}

/**
 * Validates the user's selected industries.
 * @param industries Array of industry IDs
 * @returns An object indicating validity and any error
 */
export function validateIndustries(industries: string[]): { isValid: boolean; error?: ValidationErrors } {
  if (!Array.isArray(industries) || industries.length < 3) {
    return { isValid: false, error: ValidationErrors.INSUFFICIENT_INDUSTRIES };
  }
  // TODO: Implement industry ID validation against known industries
  return { isValid: true };
}

/**
 * Validates the user's selected interests.
 * @param interests Array of interest IDs
 * @returns An object indicating validity and any error
 */
export function validateInterests(interests: string[]): { isValid: boolean; error?: ValidationErrors } {
  if (!Array.isArray(interests) || interests.length < 3) {
    return { isValid: false, error: ValidationErrors.INSUFFICIENT_INTERESTS };
  }
  // TODO: Implement interest ID validation against known interests
  return { isValid: true };
}

/**
 * Validates the user's location data.
 * @param location Object containing city and zipCode
 * @returns An object indicating validity and any error
 */
export function validateLocation(location: ILocation): { isValid: boolean; error?: ValidationErrors } {
  if (!location.city || !location.zipCode) {
    return { isValid: false, error: ValidationErrors.MISSING_REQUIRED };
  }
  // TODO: Implement more robust zipCode validation based on known patterns
  const zipCodePattern = /^\d{5}(-\d{4})?$/; // Basic US ZIP code pattern
  if (!zipCodePattern.test(location.zipCode)) {
    return { isValid: false, error: ValidationErrors.MISSING_REQUIRED };
  }
  return { isValid: true };
}

/**
 * Comprehensive validation for user creation data.
 * @param userData User creation data
 * @returns An object indicating validity and any errors
 */
export function validateUserCreate(userData: IUserCreate): { isValid: boolean; errors: ValidationErrors[] } {
  const errors: ValidationErrors[] = [];

  const phoneValidation = validatePhoneNumber(userData.phoneNumber);
  if (!phoneValidation.isValid) {
    errors.push(ValidationErrors.INVALID_PHONE);
  }

  const industriesValidation = validateIndustries(userData.industries);
  if (!industriesValidation.isValid) {
    errors.push(industriesValidation.error!);
  }

  const interestsValidation = validateInterests(userData.interests);
  if (!interestsValidation.isValid) {
    errors.push(interestsValidation.error!);
  }

  const locationValidation = validateLocation(userData.location);
  if (!locationValidation.isValid) {
    errors.push(locationValidation.error!);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates user update data, checking only the fields that are provided.
 * @param updateData User update data
 * @returns An object indicating validity and any errors
 */
export function validateUserUpdate(updateData: IUserUpdate): { isValid: boolean; errors: ValidationErrors[] } {
  const errors: ValidationErrors[] = [];

  if (updateData.industries) {
    const industriesValidation = validateIndustries(updateData.industries);
    if (!industriesValidation.isValid) {
      errors.push(industriesValidation.error!);
    }
  }

  if (updateData.interests) {
    const interestsValidation = validateInterests(updateData.interests);
    if (!interestsValidation.isValid) {
      errors.push(interestsValidation.error!);
    }
  }

  if (updateData.location) {
    const locationValidation = validateLocation(updateData.location);
    if (!locationValidation.isValid) {
      errors.push(locationValidation.error!);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to get error messages for validation errors.
 * @param errors Array of validation errors
 * @returns Array of error messages
 */
export function getValidationErrorMessages(errors: ValidationErrors[]): string[] {
  return errors.map(error => ERROR_MESSAGES[error]);
}

/**
 * @fileoverview This file provides utility functions for validating user data across the Pollen8 platform.
 * It addresses several key requirements:
 * 1. Verified Connections: Validates phone numbers for authentication (Technical Specification/1.1 System Objectives)
 * 2. Industry Focus: Validates industry selections (minimum 3) (Technical Specification/1.2 Scope/Limitations and Constraints)
 * 3. User-Centric Design: Ensures data validation for better UX (Technical Specification/1.1 System Objectives)
 * 4. Data Integrity: Implements comprehensive validation for user data (Technical Specification/2.5 Security Protocols)
 */