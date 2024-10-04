import { Request, Response, NextFunction } from 'express';
import { UserValidator } from '../../shared/validators/user.validator';
import { validateConnection, validateConnectionCreate, validateConnectionUpdate } from '../../shared/validators/connection.validator';
import { validateInviteCreate, validateInviteUpdate, validateInviteCode } from '../../shared/validators/invite.validator';
import { ValidationError } from '../../shared/interfaces/error.interface';

/**
 * Enum defining the types of validators available
 */
enum ValidatorType {
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  CONNECTION_CREATE = 'CONNECTION_CREATE',
  CONNECTION_UPDATE = 'CONNECTION_UPDATE',
  INVITE_CREATE = 'INVITE_CREATE',
  INVITE_UPDATE = 'INVITE_UPDATE',
  INVITE_CODE = 'INVITE_CODE'
}

/**
 * Interface defining the structure of a validation schema
 */
interface Schema {
  validate(data: unknown): { isValid: boolean; errors?: ValidationError[] };
}

/**
 * A higher-order function that returns an Express middleware for validating requests based on the specified validator type
 * 
 * @param validatorType The type of validator to use
 * @returns Express middleware function
 */
export const validateRequest = (validatorType: ValidatorType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let validationResult;

    switch (validatorType) {
      case ValidatorType.USER_CREATE:
        validationResult = UserValidator.validateCreate(req.body);
        break;
      case ValidatorType.USER_UPDATE:
        validationResult = UserValidator.validateUpdate(req.body);
        break;
      case ValidatorType.CONNECTION_CREATE:
        validationResult = validateConnectionCreate(req.body);
        break;
      case ValidatorType.CONNECTION_UPDATE:
        // Assuming the current status is passed in the request params or body
        const currentStatus = req.params.status || req.body.currentStatus;
        validationResult = validateConnectionUpdate(req.body, currentStatus);
        break;
      case ValidatorType.INVITE_CREATE:
        validationResult = validateInviteCreate(req.body);
        break;
      case ValidatorType.INVITE_UPDATE:
        validationResult = validateInviteUpdate(req.body);
        break;
      case ValidatorType.INVITE_CODE:
        validationResult = validateInviteCode(req.params.code || req.body.code);
        break;
      default:
        return res.status(500).json({ error: 'Invalid validator type' });
    }

    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.errors
      });
    }

    next();
  };
};

/**
 * A middleware generator for validating request body against a provided schema
 * 
 * @param schema The schema to validate against
 * @returns Express middleware function
 */
export const validateBody = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationResult = schema.validate(req.body);

    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationResult.errors
      });
    }

    next();
  };
};

/**
 * This middleware module provides request validation for the Pollen8 API endpoints,
 * ensuring data integrity and consistency before request processing.
 * 
 * Requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives)
 *    - Validates incoming request data for user verification
 * 2. Industry Focus (Technical Specification/1.2 Scope/Limitations and Constraints)
 *    - Ensures industry-related data meets requirements
 * 3. User-Centric Design (Technical Specification/1.1 System Objectives)
 *    - Provides clear validation error responses
 * 
 * The module exports two main functions:
 * 1. validateRequest: A higher-order function for creating middleware based on validator types
 * 2. validateBody: A middleware generator for schema-based body validation
 * 
 * Usage example:
 * import { validateRequest, ValidatorType } from './validation.middleware';
 * 
 * router.post('/users', validateRequest(ValidatorType.USER_CREATE), createUser);
 * router.put('/users/:id', validateRequest(ValidatorType.USER_UPDATE), updateUser);
 * router.post('/connections', validateRequest(ValidatorType.CONNECTION_CREATE), createConnection);
 */