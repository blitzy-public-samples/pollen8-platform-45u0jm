import { z } from 'zod';
import { IConnection, IConnectionCreate, IConnectionUpdate } from '../interfaces/connection.interface';
import { connectionSchema, connectionCreateSchema, connectionUpdateSchema } from '../schemas/connection.schema';
import { ConnectionStatus } from '../enums/connectionStatus.enum';
import { NETWORK_VALUE_PER_CONNECTION } from '../constants/networkValue';

/**
 * Type definition for validation results
 */
type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors?: string[];
};

/**
 * Validates a complete connection object against the connection schema and business rules
 * @param data The connection data to validate
 * @returns Validation result containing success status, data, and potential errors
 */
export function validateConnection(data: unknown): ValidationResult<IConnection> {
  try {
    const validatedData = connectionSchema.parse(data);
    
    // Additional business rule validations
    const errors: string[] = [];

    if (validatedData.userId === validatedData.connectedUserId) {
      errors.push('Users cannot connect with themselves');
    }

    if (validatedData.createdAt > validatedData.updatedAt) {
      errors.push('Created date cannot be after updated date');
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors.map(e => e.message) };
    }
    return { success: false, errors: ['An unexpected error occurred during validation'] };
  }
}

/**
 * Validates data for creating a new connection, ensuring users can be connected
 * @param data The connection creation data to validate
 * @returns Validation result for connection creation data
 */
export function validateConnectionCreate(data: unknown): ValidationResult<IConnectionCreate> {
  try {
    const validatedData = connectionCreateSchema.parse(data);
    
    if (validatedData.userId === validatedData.connectedUserId) {
      return { success: false, errors: ['Users cannot connect with themselves'] };
    }

    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors.map(e => e.message) };
    }
    return { success: false, errors: ['An unexpected error occurred during validation'] };
  }
}

/**
 * Validates connection update data, ensuring valid status transitions
 * @param data The connection update data to validate
 * @param currentStatus The current status of the connection
 * @returns Validation result for connection update data
 */
export function validateConnectionUpdate(data: unknown, currentStatus: ConnectionStatus): ValidationResult<IConnectionUpdate> {
  try {
    const validatedData = connectionUpdateSchema.parse(data);
    
    // Define valid status transitions
    const STATUS_TRANSITIONS = new Map<ConnectionStatus, ConnectionStatus[]>([
      [ConnectionStatus.PENDING, [ConnectionStatus.ACCEPTED, ConnectionStatus.REJECTED, ConnectionStatus.BLOCKED]],
      [ConnectionStatus.ACCEPTED, [ConnectionStatus.BLOCKED]],
      [ConnectionStatus.REJECTED, [ConnectionStatus.PENDING, ConnectionStatus.BLOCKED]],
      [ConnectionStatus.BLOCKED, [ConnectionStatus.PENDING]],
    ]);

    const validTransitions = STATUS_TRANSITIONS.get(currentStatus) || [];
    if (!validTransitions.includes(validatedData.status)) {
      return { success: false, errors: [`Invalid status transition from ${currentStatus} to ${validatedData.status}`] };
    }

    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.errors.map(e => e.message) };
    }
    return { success: false, errors: ['An unexpected error occurred during validation'] };
  }
}

/**
 * Validates and calculates the shared industries between two users
 * @param userIndustries Industries of the first user
 * @param connectedUserIndustries Industries of the second user
 * @returns Array of shared industries
 */
export function validateSharedIndustries(userIndustries: string[], connectedUserIndustries: string[]): string[] {
  const sharedIndustries = userIndustries.filter(industry => connectedUserIndustries.includes(industry));
  return sharedIndustries;
}

/**
 * Calculates the network value for a connection
 * @param sharedIndustriesCount The number of shared industries between connected users
 * @returns The calculated network value
 */
export function calculateNetworkValue(sharedIndustriesCount: number): number {
  return NETWORK_VALUE_PER_CONNECTION * (1 + (sharedIndustriesCount * 0.1));
}

/**
 * This file implements validation functions for connection-related data in the Pollen8 platform,
 * ensuring data integrity and enforcing business rules for professional connections between users.
 * 
 * Requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives)
 *    - Implements validation logic for authentic professional connections
 * 2. Industry Focus (Technical Specification/1.1 System Objectives)
 *    - Validates industry-specific connection requirements
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Ensures connections meet value calculation criteria
 * 
 * The validation functions in this file play a crucial role in maintaining data consistency
 * and enforcing business rules across the Pollen8 platform, supporting the core objectives
 * of verified connections, industry focus, and quantifiable networking.
 */