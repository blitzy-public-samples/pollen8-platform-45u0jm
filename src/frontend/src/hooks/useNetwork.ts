import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'react-query';
import { IConnection, ConnectionStatus } from '@shared/interfaces/connection.interface';
import { NetworkGraphData, INetworkStats, NETWORK_VALUE_PER_CONNECTION } from '@shared/types/network.types';
import { ApiService } from '../services/api';
import { WebSocketService } from '../services/websocket';
import { calculateClientNetworkValue, prepareNetworkGraphData } from '../utils/networkCalculation';

// Query key for network data
const NETWORK_QUERY_KEY = 'network';

/**
 * Custom hook for managing network-related state and operations
 * @returns An object containing network data and functions for network management
 */
export const useNetwork = () => {
  const [filteredIndustry, setFilteredIndustry] = useState<string | null>(null);
  const [networkValue, setNetworkValue] = useState<number>(0);

  // Fetch network data
  const { data: networkData, isLoading, error, refetch } = useQuery(NETWORK_QUERY_KEY, ApiService.getNetworkData);

  // Prepare graph data
  const graphData: NetworkGraphData = networkData ? prepareNetworkGraphData(networkData.connections) : { nodes: [], links: [], totalValue: 0 };

  // Calculate network stats
  const networkStats: INetworkStats = networkData ? {
    totalConnections: networkData.connections.length,
    byIndustry: networkData.connections.reduce((acc, conn) => {
      conn.sharedIndustries.forEach(industry => {
        acc[industry] = (acc[industry] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
    networkValue: networkValue,
    growthRate: networkData.growthRate
  } : { totalConnections: 0, byIndustry: {}, networkValue: 0, growthRate: 0 };

  // Update network value
  useEffect(() => {
    if (networkData) {
      const calculatedValue = calculateClientNetworkValue(networkData.connections);
      setNetworkValue(calculatedValue);
    }
  }, [networkData]);

  // WebSocket subscription for real-time updates
  useEffect(() => {
    const wsService = WebSocketService.getInstance();
    wsService.subscribe('network.update', handleNetworkUpdate);
    return () => {
      wsService.unsubscribe('network.update', handleNetworkUpdate);
    };
  }, []);

  // Handle real-time network updates
  const handleNetworkUpdate = useCallback((updatedConnection: IConnection) => {
    refetch();
  }, [refetch]);

  // Mutation for adding a connection
  const addConnectionMutation = useMutation(
    (userId: string) => ApiService.addConnection(userId),
    {
      onSuccess: () => {
        refetch();
      },
    }
  );

  // Mutation for removing a connection
  const removeConnectionMutation = useMutation(
    (connectionId: string) => ApiService.removeConnection(connectionId),
    {
      onSuccess: () => {
        refetch();
      },
    }
  );

  // Function to add a new connection
  const addConnection = async (userId: string) => {
    await addConnectionMutation.mutateAsync(userId);
  };

  // Function to remove a connection
  const removeConnection = async (connectionId: string) => {
    await removeConnectionMutation.mutateAsync(connectionId);
  };

  // Function to filter connections by industry
  const filterByIndustry = (industryId: string) => {
    setFilteredIndustry(industryId);
  };

  // Filter connections based on selected industry
  const filteredConnections = filteredIndustry
    ? networkData?.connections.filter(conn => conn.sharedIndustries.includes(filteredIndustry))
    : networkData?.connections;

  return {
    connections: filteredConnections || [],
    networkValue,
    networkStats,
    graphData,
    isLoading,
    error,
    addConnection,
    removeConnection,
    filterByIndustry,
  };
};

/**
 * @fileoverview This file implements the useNetwork custom hook, which manages network-related state and operations.
 * It addresses the following requirements:
 * 1. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Implements network value calculation and updates
 * 2. Industry Focus (Technical Specification/1.1 System Objectives)
 *    - Provides industry-specific filtering functionality
 * 3. Network Management and Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 *    - Prepares data for network visualization and provides network management functions
 */