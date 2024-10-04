/**
 * This TypeScript enumeration file defines the standardized metrics used for analytics
 * throughout the Pollen8 platform, ensuring consistent measurement and reporting of
 * user networking activities.
 * 
 * Requirements addressed:
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives):
 *   Define standardized metrics for network value calculation
 * - Data-Driven Networking (Technical Specification/1.2 Scope/Benefits):
 *   Establish enum values for measurable network metrics
 * - Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities):
 *   Provide metric types for analytics visualization
 */

/**
 * An enumeration of all possible analytics metrics in the Pollen8 platform
 */
export enum AnalyticsMetric {
  /**
   * Metric for total calculated network value (3.14 per connection)
   */
  NETWORK_VALUE = 'networkValue',

  /**
   * Metric for total number of connections
   */
  CONNECTION_COUNT = 'connectionCount',

  /**
   * Metric for network growth rate over time
   */
  GROWTH_RATE = 'growthRate',

  /**
   * Metric for distribution of connections by industry
   */
  INDUSTRY_DISTRIBUTION = 'industryDistribution',

  /**
   * Metric for number of clicks on invite links
   */
  INVITE_CLICKS = 'inviteClicks',

  /**
   * Metric for successful conversions from invites
   */
  INVITE_CONVERSIONS = 'inviteConversions',

  /**
   * Metric for daily user activity levels
   */
  DAILY_ACTIVITY = 'dailyActivity'
}

/**
 * Notes:
 * - All enum values are lowercase, hyphen-separated strings for consistency
 * - These metrics align with the platform's focus on quantifiable networking
 * - The enum is used across frontend and backend for consistent analytics tracking
 * - Each metric corresponds to specific visualization components in the UI
 * - Metrics support both real-time tracking and historical analysis
 */