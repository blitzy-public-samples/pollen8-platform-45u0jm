import { ObjectId } from 'mongodb';
import { IUser } from './user.interface';

/**
 * Defines the structure of an industry in the Pollen8 platform
 * @description This interface represents the core industry data structure, addressing the Industry Focus requirement
 * @requirement Industry Focus (Technical Specification/1.1 System Objectives)
 * @requirement Multi-industry selection (Technical Specification/1.2 Scope/Core Functionalities)
 */
export interface IIndustry {
  /** Unique identifier for the industry */
  _id: ObjectId;

  /** Name of the industry */
  name: string;

  /** Description of the industry */
  description: string;

  /** Timestamp of when the industry was created */
  createdAt: Date;

  /** Timestamp of when the industry was last updated */
  updatedAt: Date;
}

/**
 * Defines the structure for creating a new industry
 * @description This interface is used when adding a new industry to the platform
 */
export interface IIndustryCreate {
  /** Name of the new industry */
  name: string;

  /** Description of the new industry */
  description: string;
}

/**
 * Defines the structure for updating an existing industry
 * @description This interface is used when updating industry information, with all fields being optional
 */
export interface IIndustryUpdate {
  /** Optional new name for the industry */
  name?: string;

  /** Optional new description for the industry */
  description?: string;
}

/**
 * Type alias for API response containing industry data
 * @description This type is used for API responses that include industry data
 */
export type IndustryResponse = {
  /** The industry data */
  industry: IIndustry;
};

/**
 * Defines the structure for industry-specific networks
 * @description This interface represents the relationship between industries and users, enabling industry-based networking
 * @requirement Industry-specific networks (Technical Specification/1.2 Scope/Core Functionalities)
 */
export interface IIndustryNetwork {
  /** The industry for this network */
  industry: IIndustry;

  /** Users associated with this industry */
  users: IUser[];
}

/**
 * @fileoverview This file defines the industry-related interfaces for the Pollen8 platform.
 * It addresses several key requirements:
 * 1. Industry Focus: Provides structure for industry data (Technical Specification/1.1 System Objectives)
 * 2. Multi-industry selection: Supports multiple industry categorization (Technical Specification/1.2 Scope/Core Functionalities)
 * 3. Industry-specific networks: Enables industry-based networking (Technical Specification/1.2 Scope/Core Functionalities)
 * 
 * The interfaces defined here ensure type safety and consistent industry representation across the frontend and backend.
 */