import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useInvite } from '../../hooks/useInvite';
import { IInvite, InviteAnalytics as IInviteAnalytics } from '@shared/interfaces/invite.interface';
import { NetworkAnalytics } from '@shared/types/analytics.types';
import { formatDate, formatNumber } from '../../utils/formatting';

interface InviteAnalyticsProps {
  inviteId: string;
  className?: string;
}

/**
 * A React component that visualizes analytics data for invite links in the Pollen8 platform
 * @param {InviteAnalyticsProps} props - The component props
 * @returns {JSX.Element} The rendered component
 */
const InviteAnalytics: React.FC<InviteAnalyticsProps> = ({ inviteId, className = '' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const { invites, analytics, isLoading, error } = useInvite();
  const [invite, setInvite] = useState<IInvite | null>(null);
  const [inviteAnalytics, setInviteAnalytics] = useState<IInviteAnalytics | null>(null);

  useEffect(() => {
    const currentInvite = invites.find(inv => inv._id.toString() === inviteId);
    if (currentInvite) {
      setInvite(currentInvite);
      setInviteAnalytics(analytics[inviteId]);
    }
  }, [inviteId, invites, analytics]);

  useEffect(() => {
    if (svgRef.current && inviteAnalytics) {
      createD3Chart(inviteAnalytics);
    }
  }, [inviteAnalytics]);

  const createD3Chart = (data: IInviteAnalytics) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous chart

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const x = d3.scaleTime()
      .range([0, width])
      .domain(d3.extent(data.dailyTrend, d => new Date(d.date)) as [Date, Date]);

    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(data.dailyTrend, d => d.clicks) as number]);

    const line = d3.line<{ date: string; clicks: number }>()
      .x(d => x(new Date(d.date)))
      .y(d => y(d.clicks));

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    g.append('path')
      .datum(data.dailyTrend)
      .attr('fill', 'none')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .attr('d', line);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .attr('color', 'white');

    g.append('g')
      .call(d3.axisLeft(y))
      .attr('color', 'white');

    // Add labels
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + margin.bottom)
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .text('Date');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 0 - margin.left)
      .attr('x', 0 - (height / 2))
      .attr('dy', '1em')
      .attr('fill', 'white')
      .attr('text-anchor', 'middle')
      .text('Clicks');
  };

  if (isLoading) {
    return <div className="text-white">Loading analytics...</div>;
  }

  if (error || !invite || !inviteAnalytics) {
    return <div className="text-white">Error loading analytics data.</div>;
  }

  return (
    <div className={`bg-black text-white p-4 rounded-lg ${className}`}>
      <h2 className="text-2xl font-semibold mb-4">{invite.name} Analytics</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm">Total Clicks</p>
          <p className="text-2xl font-bold">{formatNumber(inviteAnalytics.totalClicks)}</p>
        </div>
        <div>
          <p className="text-sm">Conversion Rate</p>
          <p className="text-2xl font-bold">{formatNumber(inviteAnalytics.totalClicks / invite.clickCount * 100)}%</p>
        </div>
      </div>
      <svg ref={svgRef} width="600" height="400" className="w-full h-auto"></svg>
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Daily Trend</h3>
        <ul className="space-y-2">
          {inviteAnalytics.dailyTrend.slice(-5).map((day) => (
            <li key={day.date} className="flex justify-between">
              <span>{formatDate(new Date(day.date))}</span>
              <span>{formatNumber(day.clicks)} clicks</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InviteAnalytics;

/**
 * @fileoverview This component visualizes analytics data for invite links in the Pollen8 platform,
 * adhering to the minimalist black and white design aesthetic while providing meaningful insights
 * into invite performance.
 * 
 * Requirements addressed:
 * 1. Analytics Visualization (Technical Specification/1.2 Scope/Core Functionalities/3)
 * 2. User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 * 
 * The component uses D3.js for creating an interactive line chart of daily invite clicks,
 * and displays key metrics such as total clicks and conversion rate. It integrates with the
 * useInvite hook for real-time data updates and follows the black and white design aesthetic
 * of the Pollen8 platform.
 */