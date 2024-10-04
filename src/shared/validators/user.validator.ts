import Joi from 'joi';
import { IUserCreate, IUserUpdate } from '../interfaces/user.interface';
import { validatePhoneNumber, validateIndustries, validateInterests, validateLocation } from '../utils/validation';
import { ValidationErrors, ERROR_MESSAGES } from '../constants/errorCodes';

/**
 * UserValidator class
 * Handles validation of user data against defined schemas and business rules
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives): Validate phone numbers for user verification
 * - Industry Focus (Technical Specification/1.2 Scope/Limitations and Constraints): Enforce minimum industry selection requirement
 * - User-Centric Design (Technical Specification/1.1 System Objectives): Provide clear, actionable validation feedback
 */
export class UserValidator {
  private static readonly MINIMUM_INDUSTRIES = 3;
  private static readonly MINIMUM_INTERESTS = 3;

  /**
   * Joi schema for user creation
   */
  private static readonly createSchema = Joi.object({
    phoneNumber: Joi.string().required(),
    industries: Joi.array().items(Joi.string()).min(UserValidator.MINIMUM_INDUSTRIES).required(),
    interests: Joi.array().items(Joi.string()).min(UserValidator.MINIMUM_INTERESTS).required(),
    location: Joi.object({
      city: Joi.string().required(),
      zipCode: Joi.string().required()
    }).required()
  });

  /**
   * Joi schema for user update
   */
  private static readonly updateSchema = Joi.object({
    industries: Joi.array().items(Joi.string()).min(UserValidator.MINIMUM_INDUSTRIES),
    interests: Joi.array().items(Joi.string()).min(UserValidator.MINIMUM_INTERESTS),
    location: Joi.object({
      city: Joi.string(),
      zipCode: Joi.string()
    })
  });

  /**
   * Validates data for user creation against schema and business rules
   * @param userData User creation data
   * @returns Validation result containing isValid flag and potential errors
   */
  public static validateCreate(userData: IUserCreate): ValidationResult {
    const { error } = UserValidator.createSchema.validate(userData, { abortEarly: false });
    const errors: ValidationError[] = [];

    if (error) {
      errors.push(...error.details.map(detail => ({
        field: detail.path.join('.'),
        code: ValidationErrors.MISSING_REQUIRED,
        message: detail.message
      })));
    }

    // Additional business rule validations
    const phoneValidation = validatePhoneNumber(userData.phoneNumber);
    if (!phoneValidation.isValid) {
      errors.push({
        field: 'phoneNumber',
        code: ValidationErrors.INVALID_PHONE,
        message: ERROR_MESSAGES[ValidationErrors.INVALID_PHONE]
      });
    }

    const industriesValidation = validateIndustries(userData.industries);
    if (!industriesValidation.isValid) {
      errors.push({
        field: 'industries',
        code: industriesValidation.error!,
        message: ERROR_MESSAGES[industriesValidation.error!]
      });
    }

    const interestsValidation = validateInterests(userData.interests);
    if (!interestsValidation.isValid) {
      errors.push({
        field: 'interests',
        code: interestsValidation.error!,
        message: ERROR_MESSAGES[interestsValidation.error!]
      });
    }

    const locationValidation = validateLocation(userData.location);
    if (!locationValidation.isValid) {
      errors.push({
        field: 'location',
        code: locationValidation.error!,
        message: ERROR_MESSAGES[locationValidation.error!]
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Validates data for user update against schema and business rules
   * @param updateData User update data
   * @returns Validation result containing isValid flag and potential errors
   */
  public static validateUpdate(updateData: IUserUpdate): ValidationResult {
    const { error } = UserValidator.updateSchema.validate(updateData, { abortEarly: false });
    const errors: ValidationError[] = [];

    if (error) {
      errors.push(...error.details.map(detail => ({
        field: detail.path.join('.'),
        code: ValidationErrors.MISSING_REQUIRED,
        message: detail.message
      })));
    }

    // Apply additional business rules for provided fields
    if (updateData.industries) {
      const industriesValidation = validateIndustries(updateData.industries);
      if (!industriesValidation.isValid) {
        errors.push({
          field: 'industries',
          code: industriesValidation.error!,
          message: ERROR_MESSAGES[industriesValidation.error!]
        });
      }
    }

    if (updateData.interests) {
      const interestsValidation = validateInterests(updateData.interests);
      if (!interestsValidation.isValid) {
        errors.push({
          field: 'interests',
          code: interestsValidation.error!,
          message: ERROR_MESSAGES[interestsValidation.error!]
        });
      }
    }

    if (updateData.location) {
      const locationValidation = validateLocation(updateData.location);
      if (!locationValidation.isValid) {
        errors.push({
          field: 'location',
          code: locationValidation.error!,
          message: ERROR_MESSAGES[locationValidation.error!]
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

/**
 * Interface defining the structure of validation results
 */
export interface ValidationResult {
  isValid: boolean;
  errors?: ValidationError[];
}

/**
 * Interface defining the structure of validation errors
 */
export interface ValidationError {
  field: string;
  code: ValidationErrors;
  message: string;
}