import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NetworkGraph from '@components/network/NetworkGraph';
import NetworkValue from '@components/network/NetworkValue';
import ConnectionCard from '@components/network/ConnectionCard';
import { useNetwork } from '@hooks/useNetwork';
import { IConnection } from '@shared/interfaces/connection.interface';
import { NetworkGraphData, INetworkStats } from '@shared/types/network.types';

// Constants for graph dimensions
const NETWORK_GRAPH_WIDTH = 800;
const NETWORK_GRAPH_HEIGHT = 600;

/**
 * NetworkPage component serves as the main network visualization and management interface in the Pollen8 platform.
 * It displays user connections, network value, and industry-specific networking features.
 * 
 * Requirements addressed:
 * - Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives)
 * - Industry Focus (Technical Specification/1.1 System Objectives)
 * - User-Centric Design (Technical Specification/1.1 System Objectives)
 * 
 * @returns {JSX.Element} The rendered NetworkPage component
 */
const NetworkPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    networkData, 
    networkStats, 
    isLoading, 
    error, 
    filterByIndustry, 
    addConnection 
  } = useNetwork();

  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);

  useEffect(() => {
    // Fetch initial network data when component mounts
    // This is handled by the useNetwork hook
  }, []);

  if (isLoading) {
    return <div className="loading">Loading your network...</div>;
  }

  if (error) {
    return <div className="error">Error loading network data. Please try again later.</div>;
  }

  /**
   * Handles filtering of network connections by industry.
   * @param {string} industryId - The ID of the selected industry
   */
  const handleIndustryFilter = (industryId: string) => {
    setSelectedIndustry(industryId);
    filterByIndustry(industryId);
  };

  /**
   * Handles the addition of a new connection to the user's network.
   * @param {string} userId - The ID of the user to be added as a connection
   */
  const handleAddConnection = async (userId: string) => {
    try {
      await addConnection(userId);
      // Optionally, you can update the local state or refetch network data here
    } catch (error) {
      console.error('Error adding connection:', error);
      // Handle error (e.g., show an error message to the user)
    }
  };

  return (
    <div className="network-page">
      <h1 className="text-3xl font-semibold mb-6">Your Professional Network</h1>
      
      <div className="network-overview flex justify-between mb-8">
        <NetworkValue value={networkStats.totalValue} growth={networkStats.growthRate} />
        <div className="network-stats">
          <p>Total Connections: {networkStats.totalConnections}</p>
          <p>Industries Represented: {networkStats.industriesCount}</p>
        </div>
      </div>

      <div className="network-visualization mb-8">
        <NetworkGraph 
          width={NETWORK_GRAPH_WIDTH} 
          height={NETWORK_GRAPH_HEIGHT} 
          className="border border-gray-200 rounded-lg shadow-lg"
        />
      </div>

      <div className="industry-filter mb-6">
        <h2 className="text-xl font-semibold mb-2">Filter by Industry</h2>
        <div className="flex flex-wrap gap-2">
          {networkStats.industries.map((industry) => (
            <button
              key={industry.id}
              onClick={() => handleIndustryFilter(industry.id)}
              className={`px-4 py-2 rounded-full ${
                selectedIndustry === industry.id
                  ? 'bg-black text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              {industry.name}
            </button>
          ))}
        </div>
      </div>

      <div className="connections-list">
        <h2 className="text-xl font-semibold mb-4">Your Connections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {networkData.connections.map((connection: IConnection) => (
            <ConnectionCard
              key={connection.id}
              connection={connection}
              onAddConnection={() => handleAddConnection(connection.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NetworkPage;

/**
 * This component serves as the main network visualization and management interface in the Pollen8 platform.
 * It integrates various sub-components to provide a comprehensive view of the user's professional network.
 * 
 * Key features:
 * - Interactive network graph visualization using D3.js
 * - Display of network value and growth metrics
 * - Industry-specific filtering of connections
 * - List view of individual connections with action capabilities
 * 
 * The component uses the useNetwork hook to manage network data and operations,
 * and leverages sub-components like NetworkGraph, NetworkValue, and ConnectionCard
 * to create a modular and maintainable structure.
 * 
 * Styling is done using Tailwind CSS classes to maintain a consistent, 
 * black and white minimalist interface as per the technical specifications.
 */