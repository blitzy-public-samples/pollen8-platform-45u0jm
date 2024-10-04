import { IConnection } from '../interfaces/connection.interface';
import { BASE_CONNECTION_VALUE } from '../constants/networkValue';
import { NetworkGraphData, INetworkStats } from '../types/network.types';
import { IUser } from '../interfaces/user.interface';

/**
 * Calculates the total network value for a user based on their connections.
 * @param connections Array of user connections
 * @returns The total network value
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives)
 */
export function calculateNetworkValue(connections: IConnection[]): number {
  // Iterate through provided connections
  const totalValue = connections.length * BASE_CONNECTION_VALUE;
  // Round result to 2 decimal places
  return Number(totalValue.toFixed(2));
}

/**
 * Calculates network statistics grouped by industry.
 * @param connections Array of user connections
 * @returns Record of industry-specific network statistics
 * @requirements Industry Focus (Technical Specification/1.1 System Objectives)
 */
export function calculateIndustryNetworks(connections: IConnection[]): Record<string, INetworkStats> {
  const industryStats: Record<string, INetworkStats> = {};

  // Group connections by industry
  connections.forEach(connection => {
    connection.sharedIndustries.forEach(industry => {
      if (!industryStats[industry]) {
        industryStats[industry] = {
          totalConnections: 0,
          byIndustry: {},
          networkValue: 0,
          growthRate: 0 // This will be calculated separately
        };
      }
      industryStats[industry].totalConnections++;
      industryStats[industry].networkValue += BASE_CONNECTION_VALUE;
    });
  });

  // Apply BASE_CONNECTION_VALUE to industry-specific calculations
  Object.keys(industryStats).forEach(industry => {
    industryStats[industry].networkValue = Number(industryStats[industry].networkValue.toFixed(2));
    industryStats[industry].byIndustry = { [industry]: industryStats[industry].totalConnections };
  });

  return industryStats;
}

/**
 * Generates data structure for D3.js network visualization.
 * @param connections Array of user connections
 * @param users Array of users
 * @returns Data structure for D3.js visualization
 * @requirements Network Management (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
export function generateNetworkGraphData(connections: IConnection[], users: IUser[]): NetworkGraphData {
  const nodes = users.map(user => ({
    id: user._id.toString(),
    user,
    industries: user.industries.map(i => i.name),
    value: user.networkValue
  }));

  const links = connections.map(connection => ({
    source: connection.userId.toString(),
    target: connection.connectedUserId.toString(),
    status: connection.status,
    sharedIndustries: connection.sharedIndustries
  }));

  const totalValue = calculateNetworkValue(connections);

  return {
    nodes,
    links,
    totalValue
  };
}

/**
 * Calculates the rate of network growth over a specified timeframe.
 * @param connections Array of user connections
 * @param timeframe Timeframe in days
 * @returns Growth rate (connections per month)
 * @requirements Network Management (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
export function calculateNetworkGrowthRate(connections: IConnection[], timeframe: number): number {
  const now = new Date();
  const timeframeStart = new Date(now.getTime() - timeframe * 24 * 60 * 60 * 1000);

  // Filter connections within specified timeframe
  const newConnections = connections.filter(conn => conn.createdAt >= timeframeStart);

  // Count new connections in period
  const newConnectionCount = newConnections.length;

  // Normalize to monthly rate
  const monthlyRate = (newConnectionCount / timeframe) * 30;

  // Return calculated growth rate
  return Number(monthlyRate.toFixed(2));
}

/**
 * @fileoverview This utility module provides functions for calculating and analyzing network values in the Pollen8 platform,
 * ensuring consistent quantification of professional connections.
 * 
 * Key requirements addressed:
 * 1. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Implemented network value calculation (3.14 per connection)
 * 2. Industry Focus (Technical Specification/1.1 System Objectives)
 *    - Calculated industry-specific network values
 * 3. Network Management (Technical Specification/1.2 Scope/Core Functionalities/2)
 *    - Provided utility functions for network analytics and visualization
 */