import { ObjectId } from 'mongodb';
import { IUser } from './user.interface';

/**
 * Defines the structure of an invite in the Pollen8 platform
 * @description This interface represents the core invite data structure, addressing various system objectives and requirements
 */
export interface IInvite {
  /** Unique identifier for the invite */
  _id: ObjectId;

  /** Reference to the user who created the invite */
  userId: ObjectId;

  /** Name or description of the invite */
  name: string;

  /** Unique code for the invite link */
  code: string;

  /** Number of times the invite link has been clicked */
  clickCount: number;

  /** Daily click data for analytics */
  dailyClickData: Record<string, number>;

  /** Timestamp of when the invite was created */
  createdAt: Date;

  /** Whether the invite is currently active */
  isActive: boolean;
}

/**
 * Defines the structure for creating a new invite
 * @description This interface is used when generating a new invite, containing only the necessary initial information
 */
export interface IInviteCreate {
  /** Reference to the user creating the invite */
  userId: ObjectId;

  /** Name or description of the invite */
  name: string;
}

/**
 * Defines the structure for updating an existing invite
 * @description This interface is used when updating invite information, with all fields being optional
 */
export interface IInviteUpdate {
  /** Optional new name or description for the invite */
  name?: string;

  /** Optional flag to activate or deactivate the invite */
  isActive?: boolean;
}

/**
 * Type alias for invite performance data
 * @description This type is used for representing analytics data for invites
 */
export type InviteAnalytics = {
  /** Total number of clicks on the invite link */
  totalClicks: number;

  /** Daily trend of clicks */
  dailyTrend: Array<{ date: string; clicks: number }>;
};

/**
 * Type alias for API response containing invite data
 * @description This type is used for API responses that include invite data and optional analytics
 */
export type InviteResponse = {
  /** The invite data */
  invite: IInvite;

  /** Optional analytics data for the invite */
  analytics?: InviteAnalytics;
};

/**
 * @fileoverview This file defines the core invite-related interfaces for the Pollen8 platform.
 * It addresses several key requirements:
 * 1. Invitation System: Defines structure for trackable invite links (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 2. Analytics Visualization: Provides structure for invite performance data (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 3. One-click Sharing: Defines invite link format for easy sharing (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 
 * Notes:
 * - Invite codes are automatically generated and guaranteed to be unique
 * - dailyClickData is used for generating time-based analytics visualizations
 * - Invite links are constructed as `https://pollen8.com/i/{code}`
 * - Analytics data is updated in real-time via WebSocket connections
 * - Inactive invites remain in the database but won't accept new connections
 */