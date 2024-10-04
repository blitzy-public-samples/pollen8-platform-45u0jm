import { select, Selection } from 'd3-selection';
import { forceSimulation, ForceLink } from 'd3-force';
import { zoom } from 'd3-zoom';
import { line } from 'd3-shape';
import '../styles/animations.css';

// Constants
const DEFAULT_NODE_RADIUS = 5;
const DEFAULT_LINK_STRENGTH = 0.3;
const ZOOM_EXTENT: [number, number] = [0.5, 2];
const TRANSITION_DURATION = 750;

// Types
interface NetworkData {
  nodes: Node[];
  links: Link[];
}

interface Node {
  id: string;
  industry: string;
}

interface Link {
  source: string;
  target: string;
}

interface NetworkGraphOptions {
  width: number;
  height: number;
  nodeRadius?: number;
  linkStrength?: number;
}

/**
 * Creates an interactive network visualization using D3.js force-directed graph layout.
 * 
 * Requirements addressed:
 * - Network Visualization: Provides utility functions for rendering interactive network graphs
 *   Location: Technical Specification/1.1 System Objectives/Quantifiable Networking
 * - User-Centric Design: Ensures smooth animations and responsive design in visualizations
 *   Location: Technical Specification/1.1 System Objectives/User-Centric Design
 * 
 * @param container - The HTML element to render the graph in
 * @param data - The network data containing nodes and links
 * @param options - Configuration options for the graph
 */
export function createNetworkGraph(
  container: HTMLElement,
  data: NetworkData,
  options: NetworkGraphOptions
): void {
  // Validate input parameters
  if (!container || !data || !options) {
    console.error('Invalid input parameters for createNetworkGraph');
    return;
  }

  const { width, height, nodeRadius = DEFAULT_NODE_RADIUS, linkStrength = DEFAULT_LINK_STRENGTH } = options;

  // Create SVG container
  const svg = select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'network-graph-transition');

  const g = svg.append('g');

  // Initialize force simulation
  const simulation = forceSimulation(data.nodes)
    .force('link', ForceLink(data.links).id((d: any) => d.id).strength(linkStrength))
    .force('charge', forceManyBody().strength(-30))
    .force('center', forceCenter(width / 2, height / 2));

  // Create and position nodes and links
  const link = g.selectAll('.link')
    .data(data.links)
    .enter().append('line')
    .attr('class', 'link')
    .style('stroke', '#999')
    .style('stroke-opacity', 0.6)
    .style('stroke-width', 1);

  const node = g.selectAll('.node')
    .data(data.nodes)
    .enter().append('circle')
    .attr('class', 'node')
    .attr('r', nodeRadius)
    .style('fill', (d: Node) => getColorByIndustry(d.industry))
    .call(drag(simulation));

  // Apply zoom behavior
  svg.call(zoom()
    .extent([[0, 0], [width, height]])
    .scaleExtent(ZOOM_EXTENT)
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    }));

  // Update positions on each tick
  simulation.on('tick', () => {
    link
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y);

    node
      .attr('cx', (d: any) => d.x)
      .attr('cy', (d: any) => d.y);
  });

  // Handle error cases
  simulation.on('error', (error) => {
    console.error('Force simulation error:', error);
  });
}

/**
 * Updates an existing network graph with new data while maintaining smooth transitions.
 * 
 * Requirements addressed:
 * - Network Visualization: Provides utility functions for rendering interactive network graphs
 *   Location: Technical Specification/1.1 System Objectives/Quantifiable Networking
 * - User-Centric Design: Ensures smooth animations and responsive design in visualizations
 *   Location: Technical Specification/1.1 System Objectives/User-Centric Design
 * 
 * @param selection - The D3 selection of the SVG element containing the graph
 * @param data - The updated network data
 */
export function updateNetworkGraph(
  selection: Selection<SVGGElement, unknown, null, undefined>,
  data: NetworkData
): void {
  // Update existing nodes and links
  const node = selection.selectAll('.node')
    .data(data.nodes, (d: any) => d.id);

  const link = selection.selectAll('.link')
    .data(data.links, (d: any) => `${d.source.id}-${d.target.id}`);

  // Handle enter and exit transitions
  node.enter().append('circle')
    .attr('class', 'node')
    .attr('r', DEFAULT_NODE_RADIUS)
    .style('fill', (d: Node) => getColorByIndustry(d.industry))
    .merge(node as any)
    .transition()
    .duration(TRANSITION_DURATION)
    .attr('r', DEFAULT_NODE_RADIUS);

  node.exit()
    .transition()
    .duration(TRANSITION_DURATION)
    .attr('r', 0)
    .remove();

  link.enter().append('line')
    .attr('class', 'link')
    .style('stroke', '#999')
    .style('stroke-opacity', 0)
    .merge(link as any)
    .transition()
    .duration(TRANSITION_DURATION)
    .style('stroke-opacity', 0.6);

  link.exit()
    .transition()
    .duration(TRANSITION_DURATION)
    .style('stroke-opacity', 0)
    .remove();

  // Update force simulation
  const simulation = forceSimulation(data.nodes)
    .force('link', ForceLink(data.links).id((d: any) => d.id).strength(DEFAULT_LINK_STRENGTH))
    .force('charge', forceManyBody().strength(-30))
    .force('center', forceCenter(selection.attr('width') / 2, selection.attr('height') / 2));

  // Ensure smooth animations
  simulation.alpha(1).restart();
}

/**
 * Creates a line chart visualization for displaying network value growth over time.
 * 
 * Requirements addressed:
 * - Analytics Visualization: Supports creation of growth tracking visualizations
 *   Location: Technical Specification/1.1 System Objectives/Quantifiable Networking
 * - User-Centric Design: Ensures smooth animations and responsive design in visualizations
 *   Location: Technical Specification/1.1 System Objectives/User-Centric Design
 * 
 * @param container - The HTML element to render the chart in
 * @param data - The value chart data
 * @param options - Configuration options for the chart
 */
export function createValueChart(
  container: HTMLElement,
  data: { date: Date; value: number }[],
  options: { width: number; height: number; margin: { top: number; right: number; bottom: number; left: number } }
): void {
  const { width, height, margin } = options;

  // Set up chart dimensions and scales
  const x = scaleTime()
    .domain(extent(data, d => d.date) as [Date, Date])
    .range([margin.left, width - margin.right]);

  const y = scaleLinear()
    .domain([0, max(data, d => d.value) as number])
    .range([height - margin.bottom, margin.top]);

  // Create SVG container
  const svg = select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'value-chart');

  // Draw axes and gridlines
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(axisBottom(x));

  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(axisLeft(y));

  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(axisBottom(x).tickSize(-height + margin.top + margin.bottom).tickFormat(() => ''));

  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(${margin.left},0)`)
    .call(axisLeft(y).tickSize(-width + margin.left + margin.right).tickFormat(() => ''));

  // Create and animate line path
  const lineGenerator = line<{ date: Date; value: number }>()
    .x(d => x(d.date))
    .y(d => y(d.value));

  const path = svg.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .attr('d', lineGenerator);

  const pathLength = path.node()?.getTotalLength() || 0;

  path
    .attr('stroke-dasharray', pathLength + ' ' + pathLength)
    .attr('stroke-dashoffset', pathLength)
    .transition()
    .duration(TRANSITION_DURATION)
    .ease(easeLinear)
    .attr('stroke-dashoffset', 0);

  // Add interactive tooltips
  const tooltip = select(container)
    .append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  const bisect = bisector((d: { date: Date; value: number }) => d.date).left;

  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .style('fill', 'none')
    .style('pointer-events', 'all')
    .on('mousemove', (event) => {
      const x0 = x.invert(pointer(event)[0]);
      const i = bisect(data, x0, 1);
      const d0 = data[i - 1];
      const d1 = data[i];
      const d = x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime() ? d1 : d0;

      tooltip.transition()
        .duration(100)
        .style('opacity', 0.9);
      tooltip.html(`Date: ${d.date.toLocaleDateString()}<br>Value: ${d.value.toFixed(2)}`)
        .style('left', `${pointer(event)[0] + 10}px`)
        .style('top', `${pointer(event)[1] - 28}px`);
    })
    .on('mouseout', () => {
      tooltip.transition()
        .duration(500)
        .style('opacity', 0);
    });
}

/**
 * Sets up zoom and pan functionality for network visualizations.
 * 
 * Requirements addressed:
 * - User-Centric Design: Ensures smooth animations and responsive design in visualizations
 *   Location: Technical Specification/1.1 System Objectives/User-Centric Design
 * 
 * @param svg - The D3 selection of the SVG element
 * @param g - The D3 selection of the group element containing the graph
 */
export function setupZoomBehavior(
  svg: Selection<SVGElement, unknown, null, undefined>,
  g: Selection<SVGGElement, unknown, null, undefined>
): void {
  // Create zoom behavior
  const zoomBehavior = zoom()
    .extent([[0, 0], [svg.attr('width'), svg.attr('height')]])
    .scaleExtent(ZOOM_EXTENT)
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });

  // Attach zoom handler to SVG
  svg.call(zoomBehavior);

  // Implement smooth zoom transitions
  function smoothZoom(scale: number) {
    const transform = zoomIdentity
      .translate(svg.attr('width') / 2, svg.attr('height') / 2)
      .scale(scale)
      .translate(-svg.attr('width') / 2, -svg.attr('height') / 2);

    svg.transition()
      .duration(TRANSITION_DURATION)
      .call(zoomBehavior.transform, transform);
  }

  // Example usage: smoothZoom(1.5) to zoom in, smoothZoom(1) to reset
  // Expose smoothZoom function if needed
  // return { smoothZoom };
}

// Helper function to get color based on industry
function getColorByIndustry(industry: string): string {
  // Implement color mapping logic here
  // For now, return a default color
  return '#ffffff';
}

// Import necessary D3 modules
import { forceManyBody, forceCenter } from 'd3-force';
import { drag } from 'd3-drag';
import { scaleTime, scaleLinear } from 'd3-scale';
import { extent, max, bisector } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { easeLinear } from 'd3-ease';
import { pointer } from 'd3-selection';
import { zoomIdentity } from 'd3-zoom';