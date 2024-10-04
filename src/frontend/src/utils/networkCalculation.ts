import { BASE_CONNECTION_VALUE } from '@shared/constants/networkValue';
import { IConnection } from '@shared/interfaces/connection.interface';
import { NetworkGraphData } from '@shared/types/network.types';
import * as d3 from 'd3';

/**
 * Calculates the total network value for display in the client, using the constant 3.14 per connection.
 * @param connections - Array of user connections
 * @returns The calculated network value
 */
export function calculateClientNetworkValue(connections: IConnection[]): number {
  // Validate input connections array
  if (!Array.isArray(connections)) {
    throw new Error('Invalid input: connections must be an array');
  }

  // Multiply connection count by BASE_CONNECTION_VALUE (3.14)
  const networkValue = connections.length * BASE_CONNECTION_VALUE;

  // Return the calculated value
  return networkValue;
}

/**
 * Prepares connection data for visualization using D3.js in the NetworkGraph component.
 * @param connections - Array of user connections
 * @returns Formatted data for D3.js visualization
 */
export function prepareNetworkGraphData(connections: IConnection[]): NetworkGraphData {
  // Validate input connections array
  if (!Array.isArray(connections)) {
    throw new Error('Invalid input: connections must be an array');
  }

  // Transform connections into nodes and links
  const nodes = connections.map((connection, index) => ({
    id: connection.id,
    name: connection.name,
    industry: connection.industry,
  }));

  const links = connections.map((connection, index) => ({
    source: 'currentUser', // Assuming the current user is at the center
    target: connection.id,
  }));

  // Add the current user as a central node
  nodes.unshift({ id: 'currentUser', name: 'You', industry: 'Central' });

  // Calculate network value
  const networkValue = calculateClientNetworkValue(connections);

  // Return structured NetworkGraphData object
  return {
    nodes,
    links,
    networkValue,
  };
}

/**
 * Calculates the distribution of connections across different industries for visualization.
 * @param connections - Array of user connections
 * @returns Object mapping industries to connection counts
 */
export function calculateIndustryDistribution(connections: IConnection[]): Record<string, number> {
  // Validate input connections array
  if (!Array.isArray(connections)) {
    throw new Error('Invalid input: connections must be an array');
  }

  // Iterate through connections and group by industry
  const distribution: Record<string, number> = {};
  connections.forEach((connection) => {
    const industry = connection.industry || 'Unknown';
    distribution[industry] = (distribution[industry] || 0) + 1;
  });

  return distribution;
}

/**
 * Formats a network value for display, ensuring consistent presentation across the UI.
 * @param value - The network value to format
 * @returns Formatted network value string
 */
export function formatNetworkValue(value: number): string {
  // Round to specified precision (2 decimal places)
  const roundedValue = Math.round(value * 100) / 100;

  // Format as string with consistent decimal places
  return roundedValue.toFixed(2);
}

/**
 * Generates a color scale for industry visualization based on the number of unique industries.
 * @param industries - Array of unique industry names
 * @returns D3 color scale function
 */
export function generateIndustryColorScale(industries: string[]): d3.ScaleOrdinal<string, string> {
  const colorScale = d3.scaleOrdinal<string>()
    .domain(industries)
    .range(d3.schemeCategory10);

  return colorScale;
}

/**
 * Calculates the force simulation parameters for the D3.js network graph.
 * @param connections - Array of user connections
 * @returns Object with force simulation parameters
 */
export function calculateForceSimulationParams(connections: IConnection[]): {
  charge: number;
  linkDistance: number;
} {
  const nodeCount = connections.length + 1; // Including the current user
  const charge = -30 * Math.log(nodeCount + 1); // Logarithmic scaling for charge
  const linkDistance = 30 + 10 * Math.log(nodeCount); // Logarithmic scaling for link distance

  return {
    charge,
    linkDistance,
  };
}

/**
 * Calculates the network growth rate based on historical connection data.
 * @param connectionHistory - Array of connection counts over time
 * @returns Growth rate as a percentage
 */
export function calculateNetworkGrowthRate(connectionHistory: number[]): number {
  if (connectionHistory.length < 2) {
    return 0;
  }

  const oldestCount = connectionHistory[0];
  const newestCount = connectionHistory[connectionHistory.length - 1];
  const growthRate = ((newestCount - oldestCount) / oldestCount) * 100;

  return Math.round(growthRate * 100) / 100; // Round to 2 decimal places
}