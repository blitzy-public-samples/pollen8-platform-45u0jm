import { ObjectId } from 'mongodb';
import { IUser } from '../interfaces/user.interface';
import { IInvite } from '../interfaces/invite.interface';

/**
 * Type definition for network-related analytics data
 * @description Addresses the Quantifiable Networking requirement (Technical Specification/1.1 System Objectives)
 */
export type NetworkAnalytics = {
  /** The user ID associated with this network analytics data */
  userId: ObjectId;

  /** The calculated network value for the user */
  networkValue: number;

  /** The total number of connections in the user's network */
  connectionCount: number;

  /** The rate of growth of the user's network */
  growthRate: number;

  /** Distribution of industries within the user's network */
  industryDistribution: Record<string, number>;
};

/**
 * Type definition for invitation-related analytics
 * @description Addresses the Invitation System requirement (Technical Specification/1.2 Scope/Core Functionalities)
 */
export type InviteAnalytics = {
  /** The invite ID associated with this analytics data */
  inviteId: ObjectId;

  /** The total number of clicks on the invite link */
  clickCount: number;

  /** The conversion rate of clicks to new connections */
  conversionRate: number;

  /** Daily click data for the invite */
  dailyClicks: Record<string, number>;
};

/**
 * Interface for specifying analytics timeframe
 * @description Allows for flexible time-based analytics queries
 */
export interface IAnalyticsTimeframe {
  /** The start date of the analytics timeframe */
  startDate: Date;

  /** The end date of the analytics timeframe */
  endDate: Date;
}

/**
 * Interface for standardized analytics API responses
 * @description Provides a consistent structure for analytics data responses
 */
export interface IAnalyticsResponse {
  /** The timeframe for which the analytics data is provided */
  timeframe: IAnalyticsTimeframe;

  /** Optional network analytics data */
  networkAnalytics?: NetworkAnalytics;

  /** Optional array of invite analytics data */
  inviteAnalytics?: InviteAnalytics[];
}

/**
 * Type for network value calculation function
 * @description Defines the structure for network value calculation functions
 */
export type NetworkValueCalculator = (user: IUser) => number;

/**
 * Type for invite performance calculation function
 * @description Defines the structure for invite performance calculation functions
 */
export type InvitePerformanceCalculator = (invite: IInvite) => InviteAnalytics;

/**
 * Enum for different types of analytics metrics
 * @description Provides a set of predefined analytics metrics for consistent usage
 */
export enum AnalyticsMetric {
  NetworkValue = 'networkValue',
  ConnectionCount = 'connectionCount',
  GrowthRate = 'growthRate',
  InviteClicks = 'inviteClicks',
  ConversionRate = 'conversionRate'
}

/**
 * Type for analytics data point
 * @description Represents a single data point in time-series analytics data
 */
export type AnalyticsDataPoint = {
  timestamp: Date;
  value: number;
};

/**
 * Type for time-series analytics data
 * @description Represents a series of data points for a specific analytics metric
 */
export type TimeSeriesData = {
  metric: AnalyticsMetric;
  data: AnalyticsDataPoint[];
};

/**
 * @fileoverview This file defines the types and interfaces for analytics-related data in the Pollen8 platform,
 * ensuring consistent analytics data structures across frontend and backend components.
 * 
 * It addresses the following requirements:
 * 1. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 * 2. Invitation System (Technical Specification/1.2 Scope/Core Functionalities)
 * 3. Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 * 
 * Notes:
 * - All numerical values are calculated and stored as numbers, not strings
 * - Dates in IAnalyticsTimeframe are expected to be ISO strings when serialized
 * - industryDistribution uses industry IDs as keys and percentages as values
 * - dailyClicks uses ISO date strings as keys and click counts as values
 * - Analytics types support both real-time and historical data analysis
 */