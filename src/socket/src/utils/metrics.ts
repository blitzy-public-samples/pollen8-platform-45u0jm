import { Counter, Gauge, Histogram, Registry } from 'prom-client';
import { socketLogger } from './logger';

// Enum for metric types
export enum MetricTypes {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram'
}

// Main class for managing WebSocket-related metrics collection and reporting
export class SocketMetrics {
  private registry: Registry;
  private counters: Map<string, Counter>;
  private gauges: Map<string, Gauge>;
  private histograms: Map<string, Histogram>;

  constructor() {
    this.registry = new Registry();
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
    this.initializeMetrics();
  }

  /**
   * Initializes all required metrics collectors
   */
  private initializeMetrics(): void {
    // Initialize counter metrics
    this.counters.set('active_connections', new Counter({
      name: 'pollen8_active_connections',
      help: 'Number of active WebSocket connections',
      labelNames: ['userId'],
      registers: [this.registry]
    }));

    // Initialize gauge metrics
    this.gauges.set('connection_duration', new Gauge({
      name: 'pollen8_connection_duration',
      help: 'Duration of WebSocket connections',
      labelNames: ['userId'],
      registers: [this.registry]
    }));

    // Initialize histogram metrics
    this.histograms.set('event_latency', new Histogram({
      name: 'pollen8_event_latency',
      help: 'Latency of WebSocket events',
      labelNames: ['eventName'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry]
    }));

    socketLogger.info('Metrics initialized successfully');
  }

  /**
   * Increments the active connection counter for a specific user
   * @param userId The ID of the user
   */
  public incrementConnectionCount(userId: string): void {
    const counter = this.counters.get('active_connections');
    if (counter) {
      counter.inc({ userId });
      socketLogger.debug(`Incremented connection count for user ${userId}`);
    } else {
      socketLogger.error('Active connections counter not found');
    }
  }

  /**
   * Decrements the active connection counter for a specific user
   * @param userId The ID of the user
   */
  public decrementConnectionCount(userId: string): void {
    const counter = this.counters.get('active_connections');
    if (counter) {
      counter.dec({ userId });
      socketLogger.debug(`Decremented connection count for user ${userId}`);
    } else {
      socketLogger.error('Active connections counter not found');
    }
  }

  /**
   * Records the latency of processing a specific event
   * @param eventName The name of the event
   * @param latencyMs The latency in milliseconds
   */
  public recordEventLatency(eventName: string, latencyMs: number): void {
    const histogram = this.histograms.get('event_latency');
    if (histogram) {
      histogram.observe({ eventName }, latencyMs);
      socketLogger.debug(`Recorded latency for event ${eventName}: ${latencyMs}ms`);
    } else {
      socketLogger.error('Event latency histogram not found');
    }
  }

  /**
   * Updates the connection duration for a specific user
   * @param userId The ID of the user
   * @param durationMs The connection duration in milliseconds
   */
  public updateConnectionDuration(userId: string, durationMs: number): void {
    const gauge = this.gauges.get('connection_duration');
    if (gauge) {
      gauge.set({ userId }, durationMs);
      socketLogger.debug(`Updated connection duration for user ${userId}: ${durationMs}ms`);
    } else {
      socketLogger.error('Connection duration gauge not found');
    }
  }

  /**
   * Retrieves the Prometheus registry containing all metrics
   * @returns The Prometheus registry
   */
  public getRegistry(): Registry {
    return this.registry;
  }
}

// Create a singleton instance of SocketMetrics
export const socketMetrics = new SocketMetrics();

/**
 * Express middleware function that exposes metrics endpoint for Prometheus scraping
 * @returns Express middleware function
 */
export function getMetricsMiddleware() {
  return async (req: any, res: any) => {
    try {
      res.set('Content-Type', socketMetrics.getRegistry().contentType);
      res.end(await socketMetrics.getRegistry().metrics());
    } catch (error) {
      socketLogger.error('Error while generating metrics', error);
      res.status(500).end();
    }
  };
}

/**
 * Generic function to record various types of metrics
 * @param metricName The name of the metric
 * @param value The value to record
 * @param labels Additional labels for the metric
 */
export function recordMetric(metricName: string, value: number, labels: Record<string, string> = {}): void {
  try {
    if (socketMetrics.getRegistry().getSingleMetric(metricName)) {
      const metric = socketMetrics.getRegistry().getSingleMetric(metricName);
      if (metric instanceof Counter) {
        metric.inc(labels, value);
      } else if (metric instanceof Gauge) {
        metric.set(labels, value);
      } else if (metric instanceof Histogram) {
        metric.observe(labels, value);
      }
      socketLogger.debug(`Recorded metric ${metricName} with value ${value} and labels ${JSON.stringify(labels)}`);
    } else {
      socketLogger.warn(`Metric ${metricName} not found`);
    }
  } catch (error) {
    socketLogger.error(`Error recording metric ${metricName}`, error);
  }
}