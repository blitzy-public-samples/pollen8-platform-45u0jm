import { IUser } from '../interfaces/user.interface';
import { IConnection } from '../interfaces/connection.interface';
import { IInvite } from '../interfaces/invite.interface';

/**
 * Enum for API routes
 * @description Defines the constant enum for API routes used across the Pollen8 platform
 */
export const enum API_ROUTES {
  AUTH = '/api/auth',
  USER = '/api/user',
  NETWORK = '/api/network',
  INVITE = '/api/invite'
}

/**
 * Generic type for all API responses
 * @description Ensures consistent structure for all API responses across the platform
 * @template T - The type of data returned in the response
 */
export type ApiResponse<T> = {
  /** Indicates whether the API call was successful */
  success: boolean;
  /** The data returned by the API */
  data: T;
  /** Optional error message if the API call was not successful */
  error?: string;
};

/**
 * Type for initiating phone verification
 * @description Used in the request body when starting the phone verification process
 * @requirements User Authentication (Technical Specification/1.2 Scope/Core Functionalities/1)
 */
export type PhoneVerificationRequest = {
  /** The phone number to be verified */
  phoneNumber: string;
};

/**
 * Type for confirming phone verification code
 * @description Used in the request body when confirming the verification code
 * @requirements User Authentication (Technical Specification/1.2 Scope/Core Functionalities/1)
 */
export type VerificationConfirmRequest = {
  /** The verification ID received during the initiation step */
  verificationId: string;
  /** The verification code received via SMS */
  code: string;
};

/**
 * Type for authentication response
 * @description Used in the response body after successful authentication
 * @requirements User Authentication (Technical Specification/1.2 Scope/Core Functionalities/1)
 */
export type AuthResponse = {
  /** JWT token for authenticated sessions */
  token: string;
  /** User object containing authenticated user's information */
  user: IUser;
};

/**
 * Type for network-related responses
 * @description Used in responses related to user's network information
 * @requirements Network Management (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
export type NetworkResponse = {
  /** Array of user's connections */
  connections: IConnection[];
  /** Calculated network value */
  networkValue: number;
  /** Object containing connections grouped by industries */
  industries: Record<string, IConnection[]>;
};

/**
 * Type for invite analytics responses
 * @description Used in responses related to invite tracking and analytics
 * @requirements Invitation System (Technical Specification/1.2 Scope/Core Functionalities/3)
 */
export type InviteTrackingResponse = {
  /** Invite object containing invite details */
  invite: IInvite;
  /** Object containing analytics data */
  analytics: {
    /** Record of daily click counts */
    daily: Record<string, number>;
    /** Total click count */
    total: number;
  };
};

/**
 * @fileoverview This TypeScript file defines common types and interfaces for API requests and responses
 * across the Pollen8 platform, ensuring consistent data structures for client-server communication.
 * 
 * It addresses the following requirements:
 * 1. User Authentication (Technical Specification/1.2 Scope/Core Functionalities/1)
 *    - Defines types for phone verification flow
 * 2. Network Management (Technical Specification/1.2 Scope/Core Functionalities/2)
 *    - Structures API responses for network data
 * 3. Invitation System (Technical Specification/1.2 Scope/Core Functionalities/3)
 *    - Defines API types for invite tracking
 * 
 * The types defined here ensure type safety and consistency across the frontend and backend,
 * facilitating easier development and maintenance of the Pollen8 platform.
 */