import { ObjectId } from 'mongodb';
import { IUser } from './user.interface';

/**
 * Enum representing the possible states of a connection
 * @description Defines the various stages a connection can be in
 */
export enum ConnectionStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED'
}

/**
 * Defines the structure of a connection between two users in the Pollen8 platform
 * @description This interface represents the core connection data structure, addressing various system objectives and requirements
 */
export interface IConnection {
  /** Unique identifier for the connection */
  _id: ObjectId;

  /** ID of the user who initiated the connection */
  userId: ObjectId;

  /** ID of the user who is connected or invited */
  connectedUserId: ObjectId;

  /** Current status of the connection */
  status: ConnectionStatus;

  /** List of industries shared between the connected users */
  sharedIndustries: string[];

  /** Timestamp of when the connection was created */
  createdAt: Date;

  /** Timestamp of when the connection was last updated */
  updatedAt: Date;
}

/**
 * Defines the structure for creating a new connection
 * @description This interface is used when initiating a new connection between users
 */
export interface IConnectionCreate {
  /** ID of the user initiating the connection */
  userId: ObjectId;

  /** ID of the user being invited to connect */
  connectedUserId: ObjectId;
}

/**
 * Defines the structure for updating an existing connection
 * @description This interface is used when updating the status of a connection
 */
export interface IConnectionUpdate {
  /** New status of the connection */
  status: ConnectionStatus;
}

/**
 * Type alias for API response containing connection data
 * @description This type is used for API responses that include connection data and related user information
 */
export type ConnectionResponse = {
  /** The connection data */
  connection: IConnection;

  /** Object containing user data for both parties in the connection */
  users: {
    /** User who initiated the connection */
    initiator: IUser;

    /** User who was invited or connected */
    connected: IUser;
  };
};

/**
 * @fileoverview This file defines the core connection-related interfaces for the Pollen8 platform.
 * It addresses several key requirements:
 * 1. Verified Connections: Defines structure for authentic professional connections (Technical Specification/1.1 System Objectives)
 * 2. Industry Focus: Enables industry-specific connection categorization through sharedIndustries (Technical Specification/1.1 System Objectives)
 * 3. Quantifiable Networking: Supports network value calculation by providing connection data (Technical Specification/1.1 System Objectives)
 */