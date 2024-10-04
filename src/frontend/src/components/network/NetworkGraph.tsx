import React, { useEffect, useRef, useState } from 'react';
import { select } from 'd3-selection';
import { createNetworkGraph, updateNetworkGraph } from '@utils/d3Helpers';
import { useNetwork } from '@hooks/useNetwork';
import { NetworkGraphData, NetworkNode, NetworkLink } from '@shared/types/network.types';

// Define constants for default width and height
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;

interface NetworkGraphProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * NetworkGraph component renders an interactive, D3.js-powered visualization of the user's professional network.
 * 
 * Requirements addressed:
 * - Network Visualization (Technical Specification/1.2 Scope/Core Functionalities/2)
 * - Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus)
 * - User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 * 
 * @param {NetworkGraphProps} props - The props for the NetworkGraph component
 * @returns {JSX.Element} The rendered NetworkGraph component
 */
const NetworkGraph: React.FC<NetworkGraphProps> = ({ 
  className = '', 
  width = DEFAULT_WIDTH, 
  height = DEFAULT_HEIGHT 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { graphData, isLoading, error } = useNetwork();
  const [graphInitialized, setGraphInitialized] = useState(false);

  useEffect(() => {
    if (!isLoading && !error && containerRef.current && graphData) {
      if (!graphInitialized) {
        // Initialize the graph on first render
        createNetworkGraph(containerRef.current, graphData, { width, height });
        setGraphInitialized(true);
      } else {
        // Update the graph when data changes
        const svg = select(containerRef.current).select('svg');
        updateNetworkGraph(svg.select('g'), graphData);
      }
    }
  }, [graphData, isLoading, error, width, height, graphInitialized]);

  // Clean up D3 event listeners on unmount
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        select(containerRef.current).selectAll('*').remove();
      }
    };
  }, []);

  if (isLoading) {
    return <div className="loading">Loading network data...</div>;
  }

  if (error) {
    return <div className="error">Error loading network data. Please try again later.</div>;
  }

  return (
    <div 
      ref={containerRef} 
      className={`network-graph ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* D3 will render the graph inside this container */}
    </div>
  );
};

export default NetworkGraph;

/**
 * This component visualizes the user's professional network using D3.js.
 * It provides an interactive graph showing connections between users with industry-specific categorization.
 * 
 * Key features:
 * - Responsive design that adapts to different screen sizes
 * - Smooth animations for graph updates
 * - Industry-specific node coloring
 * - Interactive zoom and pan functionality
 * 
 * The component uses the useNetwork hook to fetch and manage network data,
 * and utilizes D3 helper functions from d3Helpers.ts for graph creation and updates.
 */