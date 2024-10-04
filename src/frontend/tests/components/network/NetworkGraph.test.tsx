import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { select } from 'd3-selection';
import NetworkGraph from '@components/network/NetworkGraph';
import { useNetwork } from '@hooks/useNetwork';
import { createNetworkGraph, updateNetworkGraph } from '@utils/d3Helpers';

// Mock the hooks and utilities
jest.mock('@hooks/useNetwork');
jest.mock('@utils/d3Helpers');

// Define constants for testing
const TEST_WIDTH = 600;
const TEST_HEIGHT = 400;
const TEST_NODE_COUNT = 10;

// Helper function to setup the component with props
const setup = (props = {}) => {
  const defaultProps = {
    width: TEST_WIDTH,
    height: TEST_HEIGHT,
  };
  return render(<NetworkGraph {...defaultProps} {...props} />);
};

// Mock network data generator
const mockNetworkData = () => {
  const nodes = Array.from({ length: TEST_NODE_COUNT }, (_, i) => ({
    id: `node${i}`,
    name: `Node ${i}`,
    industry: `Industry ${i % 3}`,
  }));
  const links = nodes.slice(1).map((node, i) => ({
    source: nodes[0].id,
    target: node.id,
  }));
  return { nodes, links };
};

describe('NetworkGraph Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('renders without crashing', () => {
      (useNetwork as jest.Mock).mockReturnValue({
        graphData: mockNetworkData(),
        isLoading: false,
        error: null,
      });
      setup();
      expect(screen.getByTestId('network-graph')).toBeInTheDocument();
    });

    it('applies custom dimensions', () => {
      (useNetwork as jest.Mock).mockReturnValue({
        graphData: mockNetworkData(),
        isLoading: false,
        error: null,
      });
      const customWidth = 800;
      const customHeight = 600;
      setup({ width: customWidth, height: customHeight });
      const graphContainer = screen.getByTestId('network-graph');
      expect(graphContainer).toHaveStyle(`width: ${customWidth}px`);
      expect(graphContainer).toHaveStyle(`height: ${customHeight}px`);
    });

    it('shows loading state', () => {
      (useNetwork as jest.Mock).mockReturnValue({
        graphData: null,
        isLoading: true,
        error: null,
      });
      setup();
      expect(screen.getByText('Loading network data...')).toBeInTheDocument();
    });

    it('shows error state', () => {
      (useNetwork as jest.Mock).mockReturnValue({
        graphData: null,
        isLoading: false,
        error: new Error('Network error'),
      });
      setup();
      expect(screen.getByText('Error loading network data. Please try again later.')).toBeInTheDocument();
    });
  });

  describe('Interaction Tests', () => {
    it('handles node click', () => {
      const mockData = mockNetworkData();
      (useNetwork as jest.Mock).mockReturnValue({
        graphData: mockData,
        isLoading: false,
        error: null,
      });
      setup();
      const nodeElement = screen.getByTestId('node0');
      fireEvent.click(nodeElement);
      // Add assertions for node click behavior
    });

    it('supports zoom and pan', () => {
      const mockData = mockNetworkData();
      (useNetwork as jest.Mock).mockReturnValue({
        graphData: mockData,
        isLoading: false,
        error: null,
      });
      setup();
      const graphContainer = screen.getByTestId('network-graph');
      fireEvent.wheel(graphContainer);
      // Add assertions for zoom behavior
      fireEvent.mouseDown(graphContainer);
      fireEvent.mouseMove(graphContainer);
      fireEvent.mouseUp(graphContainer);
      // Add assertions for pan behavior
    });
  });

  describe('D3 Integration Tests', () => {
    it('initializes D3 visualization correctly', () => {
      const mockData = mockNetworkData();
      (useNetwork as jest.Mock).mockReturnValue({
        graphData: mockData,
        isLoading: false,
        error: null,
      });
      setup();
      expect(createNetworkGraph).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        mockData,
        { width: TEST_WIDTH, height: TEST_HEIGHT }
      );
    });

    it('updates visualization when data changes', () => {
      const initialData = mockNetworkData();
      const updatedData = {
        ...initialData,
        nodes: [...initialData.nodes, { id: 'newNode', name: 'New Node', industry: 'New Industry' }],
      };
      
      const { rerender } = setup();
      (useNetwork as jest.Mock).mockReturnValue({
        graphData: initialData,
        isLoading: false,
        error: null,
      });
      
      rerender(<NetworkGraph width={TEST_WIDTH} height={TEST_HEIGHT} />);
      (useNetwork as jest.Mock).mockReturnValue({
        graphData: updatedData,
        isLoading: false,
        error: null,
      });
      
      rerender(<NetworkGraph width={TEST_WIDTH} height={TEST_HEIGHT} />);
      expect(updateNetworkGraph).toHaveBeenCalledWith(expect.any(Object), updatedData);
    });
  });

  describe('Accessibility Tests', () => {
    it('has correct ARIA attributes', () => {
      (useNetwork as jest.Mock).mockReturnValue({
        graphData: mockNetworkData(),
        isLoading: false,
        error: null,
      });
      setup();
      const graphContainer = screen.getByTestId('network-graph');
      expect(graphContainer).toHaveAttribute('aria-label', 'Network Graph Visualization');
    });

    it('supports keyboard navigation', () => {
      (useNetwork as jest.Mock).mockReturnValue({
        graphData: mockNetworkData(),
        isLoading: false,
        error: null,
      });
      setup();
      const graphContainer = screen.getByTestId('network-graph');
      fireEvent.keyDown(graphContainer, { key: 'Tab' });
      // Add assertions for keyboard navigation
    });
  });

  describe('Performance Tests', () => {
    it('handles large datasets efficiently', () => {
      const largeDataset = mockNetworkData();
      largeDataset.nodes = Array.from({ length: 1000 }, (_, i) => ({
        id: `node${i}`,
        name: `Node ${i}`,
        industry: `Industry ${i % 10}`,
      }));
      largeDataset.links = largeDataset.nodes.slice(1).map((node, i) => ({
        source: largeDataset.nodes[0].id,
        target: node.id,
      }));

      (useNetwork as jest.Mock).mockReturnValue({
        graphData: largeDataset,
        isLoading: false,
        error: null,
      });

      const startTime = performance.now();
      setup();
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Render should take less than 1 second
    });
  });

  describe('Error Handling Tests', () => {
    it('displays fallback UI for empty data', () => {
      (useNetwork as jest.Mock).mockReturnValue({
        graphData: { nodes: [], links: [] },
        isLoading: false,
        error: null,
      });
      setup();
      expect(screen.getByText('No network data available.')).toBeInTheDocument();
    });

    it('recovers from D3 rendering errors', () => {
      (useNetwork as jest.Mock).mockReturnValue({
        graphData: mockNetworkData(),
        isLoading: false,
        error: null,
      });
      (createNetworkGraph as jest.Mock).mockImplementation(() => {
        throw new Error('D3 rendering error');
      });
      setup();
      expect(screen.getByText('Error rendering network graph. Please try again later.')).toBeInTheDocument();
    });
  });
});