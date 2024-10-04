import { NetworkGraphData } from '../types/network.types';

/**
 * Base connection value constant
 * @description Defines the constant value (3.14) for network connections
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives)
 */
export const BASE_CONNECTION_VALUE: number = 3.14;

/**
 * Minimum network size constant
 * @description Defines the minimum number of connections required for a valid network
 * @requirements Network Value Calculation (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
export const MINIMUM_NETWORK_SIZE: number = 3;

/**
 * Network value precision constant
 * @description Defines the number of decimal places to round network value calculations
 * @requirements Network Value Calculation (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
export const NETWORK_VALUE_PRECISION: number = 2;

/**
 * Network growth thresholds
 * @description Defines the thresholds for categorizing network growth rates
 * @requirements Network Value Calculation (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
export const NETWORK_GROWTH_THRESHOLDS = {
  LOW: 5,
  MEDIUM: 10,
  HIGH: 20
};

/**
 * Network value update interval
 * @description Defines the interval (in milliseconds) for updating network value calculations
 * @requirements Network Value Calculation (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
export const NETWORK_VALUE_UPDATE_INTERVAL: number = 3600000; // 1 hour in milliseconds

/**
 * Calculate network value
 * @description Calculates the total network value based on the number of connections
 * @param networkData The network graph data containing nodes and links
 * @returns The calculated network value
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives)
 */
export const calculateNetworkValue = (networkData: NetworkGraphData): number => {
  const connectionCount = networkData.links.length;
  const rawValue = connectionCount * BASE_CONNECTION_VALUE;
  return Number(rawValue.toFixed(NETWORK_VALUE_PRECISION));
};

/**
 * Determine network growth category
 * @description Categorizes the network growth rate based on predefined thresholds
 * @param growthRate The calculated growth rate of the network
 * @returns The growth category as a string: 'Low', 'Medium', or 'High'
 * @requirements Network Value Calculation (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
export const getNetworkGrowthCategory = (growthRate: number): string => {
  if (growthRate < NETWORK_GROWTH_THRESHOLDS.LOW) {
    return 'Low';
  } else if (growthRate < NETWORK_GROWTH_THRESHOLDS.MEDIUM) {
    return 'Medium';
  } else {
    return 'High';
  }
};

/**
 * Validate network size
 * @description Checks if the network meets the minimum size requirement
 * @param connectionCount The number of connections in the network
 * @returns A boolean indicating whether the network size is valid
 * @requirements Network Value Calculation (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
export const isValidNetworkSize = (connectionCount: number): boolean => {
  return connectionCount >= MINIMUM_NETWORK_SIZE;
};

/**
 * @fileoverview This TypeScript file defines constant values and utility functions related to network value calculations in the Pollen8 platform,
 * ensuring consistent application of network quantification across the application.
 * 
 * Key requirements addressed:
 * 1. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Defined BASE_CONNECTION_VALUE constant (3.14) for network connections
 *    - Implemented calculateNetworkValue function for network value calculation
 * 2. Network Value Calculation (Technical Specification/1.2 Scope/Core Functionalities/2)
 *    - Provided base constants for network analytics (MINIMUM_NETWORK_SIZE, NETWORK_VALUE_PRECISION, NETWORK_GROWTH_THRESHOLDS)
 *    - Implemented utility functions for network growth categorization and size validation
 */