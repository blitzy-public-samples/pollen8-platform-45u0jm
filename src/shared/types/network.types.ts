import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';
import { IUser } from '../interfaces/user.interface';
import { IConnection, ConnectionStatus } from '../interfaces/connection.interface';

/**
 * Constant representing the network value per connection
 * @description This value is used in network value calculations
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives)
 */
export const NETWORK_VALUE_PER_CONNECTION = 3.14;

/**
 * Type extending D3's SimulationNodeDatum for network visualization
 * @description Used for representing nodes in the D3.js network graph
 * @requirements Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
export type NetworkNode = SimulationNodeDatum & {
  id: string;
  user: IUser;
  industries: string[];
  value: number;
};

/**
 * Type extending D3's SimulationLinkDatum for connection visualization
 * @description Used for representing links (connections) in the D3.js network graph
 * @requirements Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
export type NetworkLink = SimulationLinkDatum<NetworkNode> & {
  source: string;
  target: string;
  status: ConnectionStatus;
  sharedIndustries: string[];
};

/**
 * Type for complete network graph representation
 * @description Represents the entire network graph data structure
 * @requirements Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 */
export type NetworkGraphData = {
  nodes: NetworkNode[];
  links: NetworkLink[];
  totalValue: number;
};

/**
 * Type for industry-specific network grouping
 * @description Represents a group of connections within a specific industry
 * @requirements Industry Focus (Technical Specification/1.1 System Objectives)
 */
export type IndustryNetwork = {
  industryId: string;
  name: string;
  connections: IConnection[];
  value: number;
};

/**
 * Interface for network analytics and statistics
 * @description Provides a structure for network-related analytics
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives)
 */
export interface INetworkStats {
  totalConnections: number;
  byIndustry: Record<string, number>;
  networkValue: number;
  growthRate: number;
}

/**
 * @fileoverview This TypeScript file defines essential types and interfaces for network-related functionality in the Pollen8 platform,
 * supporting the quantifiable networking feature with industry-specific categorization.
 * 
 * Key requirements addressed:
 * 1. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Defined types for network value calculation (NETWORK_VALUE_PER_CONNECTION, NetworkNode, NetworkGraphData, INetworkStats)
 * 2. Industry Focus (Technical Specification/1.1 System Objectives)
 *    - Supported types for industry-specific network categorization (IndustryNetwork, NetworkNode, NetworkLink)
 * 3. Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 *    - Provided types for D3.js network graph data structures (NetworkNode, NetworkLink, NetworkGraphData)
 */