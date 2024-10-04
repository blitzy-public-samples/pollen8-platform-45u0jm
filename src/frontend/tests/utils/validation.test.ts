import {
  validatePhoneNumber,
  validateIndustries,
  validateInterests,
  validateZipCode,
  validateProfileCompletion
} from '@frontend/utils/validation';
import { IUser } from '@shared/interfaces/user.interface';
import { ERROR_MESSAGES, ValidationErrors } from '@shared/constants/errorCodes';

// Mock the libphonenumber-js module
jest.mock('libphonenumber-js', () => ({
  parsePhoneNumber: jest.fn(),
  isValidPhoneNumber: jest.fn()
}));

describe('validatePhoneNumber', () => {
  it('should validate correct phone numbers', () => {
    const validPhoneNumbers = ['+1 (555) 123-4567', '555-123-4567', '(555) 123-4567'];
    validPhoneNumbers.forEach(number => {
      (require('libphonenumber-js').isValidPhoneNumber as jest.Mock).mockReturnValue(true);
      (require('libphonenumber-js').parsePhoneNumber as jest.Mock).mockReturnValue({
        format: () => '(555) 123-4567'
      });
      const result = validatePhoneNumber(number);
      expect(result.isValid).toBe(true);
      expect(result.formattedValue).toBe('(555) 123-4567');
    });
  });

  it('should reject invalid phone numbers', () => {
    const invalidPhoneNumbers = ['123', 'abc-def-ghij', '555-123-456'];
    invalidPhoneNumbers.forEach(number => {
      (require('libphonenumber-js').isValidPhoneNumber as jest.Mock).mockReturnValue(false);
      const result = validatePhoneNumber(number);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ERROR_MESSAGES[ValidationErrors.INVALID_PHONE]);
    });
  });

  it('should handle exceptions from libphonenumber-js', () => {
    (require('libphonenumber-js').isValidPhoneNumber as jest.Mock).mockImplementation(() => {
      throw new Error('Test error');
    });
    const result = validatePhoneNumber('123-456-7890');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ERROR_MESSAGES[ValidationErrors.INVALID_PHONE]);
  });
});

describe('validateIndustries', () => {
  it('should accept valid industry selections', () => {
    const validIndustries = ['1', '2', '3', '4'];
    const result = validateIndustries(validIndustries);
    expect(result.isValid).toBe(true);
  });

  it('should reject insufficient industry selections', () => {
    const insufficientIndustries = ['1', '2'];
    const result = validateIndustries(insufficientIndustries);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ERROR_MESSAGES[ValidationErrors.INSUFFICIENT_INDUSTRIES]);
  });

  it('should reject duplicate industry selections', () => {
    const duplicateIndustries = ['1', '2', '3', '3'];
    const result = validateIndustries(duplicateIndustries);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Duplicate industry selections are not allowed.');
  });

  it('should handle empty industry array', () => {
    const emptyIndustries: string[] = [];
    const result = validateIndustries(emptyIndustries);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ERROR_MESSAGES[ValidationErrors.INSUFFICIENT_INDUSTRIES]);
  });
});

describe('validateInterests', () => {
  it('should accept valid interest selections', () => {
    const validInterests = ['1', '2', '3', '4'];
    const result = validateInterests(validInterests);
    expect(result.isValid).toBe(true);
  });

  it('should reject insufficient interest selections', () => {
    const insufficientInterests = ['1', '2'];
    const result = validateInterests(insufficientInterests);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ERROR_MESSAGES[ValidationErrors.INSUFFICIENT_INTERESTS]);
  });

  it('should reject duplicate interest selections', () => {
    const duplicateInterests = ['1', '2', '3', '3'];
    const result = validateInterests(duplicateInterests);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Duplicate interest selections are not allowed.');
  });

  it('should handle empty interest array', () => {
    const emptyInterests: string[] = [];
    const result = validateInterests(emptyInterests);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe(ERROR_MESSAGES[ValidationErrors.INSUFFICIENT_INTERESTS]);
  });
});

describe('validateZipCode', () => {
  it('should validate correct ZIP codes', () => {
    const validZipCodes = ['12345', '12345-6789'];
    validZipCodes.forEach(zipCode => {
      const result = validateZipCode(zipCode);
      expect(result.isValid).toBe(true);
    });
  });

  it('should reject invalid ZIP codes', () => {
    const invalidZipCodes = ['1234', '123456', '12345-', '12345-67890', 'abcde'];
    invalidZipCodes.forEach(zipCode => {
      const result = validateZipCode(zipCode);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid ZIP code format. Please use 12345 or 12345-6789.');
    });
  });
});

describe('validateProfileCompletion', () => {
  it('should validate complete profile data', () => {
    const mockUser: Partial<IUser> = {
      phoneNumber: '+1 (555) 123-4567',
      industries: [{ _id: '1' }, { _id: '2' }, { _id: '3' }],
      interests: [{ _id: '1' }, { _id: '2' }, { _id: '3' }],
      location: { zipCode: '12345' }
    };
    (require('libphonenumber-js').isValidPhoneNumber as jest.Mock).mockReturnValue(true);
    (require('libphonenumber-js').parsePhoneNumber as jest.Mock).mockReturnValue({
      format: () => '(555) 123-4567'
    });
    const result = validateProfileCompletion(mockUser);
    expect(result.isValid).toBe(true);
  });

  it('should identify missing required fields', () => {
    const incompleteUser: Partial<IUser> = {
      phoneNumber: '+1 (555) 123-4567',
      industries: [{ _id: '1' }],
      interests: [{ _id: '1' }, { _id: '2' }],
      location: { zipCode: '1234' }
    };
    (require('libphonenumber-js').isValidPhoneNumber as jest.Mock).mockReturnValue(true);
    const result = validateProfileCompletion(incompleteUser);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain(ERROR_MESSAGES[ValidationErrors.INSUFFICIENT_INDUSTRIES]);
    expect(result.error).toContain(ERROR_MESSAGES[ValidationErrors.INSUFFICIENT_INTERESTS]);
    expect(result.error).toContain('Invalid ZIP code format');
  });

  it('should handle partial profile updates', () => {
    const partialUpdate: Partial<IUser> = {
      industries: [{ _id: '1' }, { _id: '2' }, { _id: '3' }],
      location: { zipCode: '12345-6789' }
    };
    const result = validateProfileCompletion(partialUpdate);
    expect(result.isValid).toBe(true);
  });

  it('should handle empty profile data', () => {
    const emptyProfile: Partial<IUser> = {};
    const result = validateProfileCompletion(emptyProfile);
    expect(result.isValid).toBe(true);
  });
});

/**
 * @fileoverview This test suite covers the frontend validation utility functions, ensuring robust input validation across the Pollen8 platform.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives): Test phone number validation functionality
 * - Industry Focus (Technical Specification/1.2 Scope/Limitations and Constraints): Verify minimum industry selection requirement testing
 * - User-Centric Design (Technical Specification/1.1 System Objectives): Ensure validation provides accurate feedback
 */