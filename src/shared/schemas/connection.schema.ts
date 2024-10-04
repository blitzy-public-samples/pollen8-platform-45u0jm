import { z } from 'zod';
import { ConnectionStatus } from '../enums/connectionStatus.enum';
import { BASE_CONNECTION_VALUE } from '../constants/networkValue';

/**
 * Connection Schema
 * 
 * This schema defines the validation rules for connection-related data in the Pollen8 platform.
 * It ensures data integrity and consistency for professional connections between users.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives)
 * - Industry Focus (Technical Specification/1.1 System Objectives)
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives)
 */

/**
 * Base Connection Schema
 * Defines the common fields for all connection-related operations
 */
const baseConnectionSchema = z.object({
  userId: z.string().uuid(),
  connectedUserId: z.string().uuid(),
  status: z.nativeEnum(ConnectionStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
  sharedIndustries: z.array(z.string()).min(1),
  networkValue: z.number().positive().multipleOf(BASE_CONNECTION_VALUE),
});

/**
 * Connection Schema
 * Extends the base schema with additional fields for full connection representation
 */
export const connectionSchema = baseConnectionSchema.extend({
  id: z.string().uuid(),
});

/**
 * Connection Create Schema
 * Defines the required fields when creating a new connection
 */
export const connectionCreateSchema = baseConnectionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  networkValue: true,
}).extend({
  status: z.literal(ConnectionStatus.INITIATED),
});

/**
 * Connection Update Schema
 * Defines the fields that can be updated for an existing connection
 */
export const connectionUpdateSchema = z.object({
  status: z.nativeEnum(ConnectionStatus),
  sharedIndustries: z.array(z.string()).min(1).optional(),
});

/**
 * Validate Connection
 * @param data The connection data to validate
 * @returns Validated connection data
 */
export const validateConnection = (data: unknown): z.infer<typeof connectionSchema> => {
  return connectionSchema.parse(data);
};

/**
 * Validate Connection Create
 * @param data The connection creation data to validate
 * @returns Validated connection creation data
 */
export const validateConnectionCreate = (data: unknown): z.infer<typeof connectionCreateSchema> => {
  return connectionCreateSchema.parse(data);
};

/**
 * Validate Connection Update
 * @param data The connection update data to validate
 * @returns Validated connection update data
 */
export const validateConnectionUpdate = (data: unknown): z.infer<typeof connectionUpdateSchema> => {
  return connectionUpdateSchema.parse(data);
};

/**
 * This file defines the validation schemas for connection-related data in the Pollen8 platform.
 * It uses the Zod library for schema definition and validation, ensuring type safety and data integrity.
 * 
 * Key features:
 * 1. Strict typing for connection fields, including status enum and UUID validation
 * 2. Separate schemas for different operations (create, update, full representation)
 * 3. Validation functions for easy integration with API endpoints and services
 * 4. Enforcement of business rules, such as minimum shared industries and network value calculation
 * 
 * The schemas and validation functions in this file play a crucial role in maintaining
 * data consistency across the Pollen8 platform, supporting the core objectives of
 * verified connections, industry focus, and quantifiable networking.
 */