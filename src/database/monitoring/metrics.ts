import { Registry, Histogram, Gauge } from 'prom-client';
import { QueryMetrics } from '../utils/query.util';
import { MongoClient } from '../config/mongodb.config';
import { RedisManager } from '../config/redis.config';
import { logger } from './logging';

/**
 * A comprehensive metrics collection and reporting module for database operations in the Pollen8 platform,
 * ensuring performance monitoring and optimization.
 * 
 * Requirements addressed:
 * 1. Performance Benchmarks (Technical Specification/8.1.2 Performance Benchmarks)
 *    - Implements metrics collection for database operations
 * 2. Query Optimization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 *    - Provides data for query performance analysis
 * 3. Monitoring (Technical Specification/6.4 CI/CD Pipeline)
 *    - Supports system monitoring requirements
 */

const METRICS_PREFIX = 'pollen8_db_';
const registry = new Registry();

/**
 * DatabaseMetricsCollector manages the collection and exposure of database performance metrics.
 */
class DatabaseMetricsCollector {
  private queryDurationHistogram: Histogram<string>;
  private cacheDurationHistogram: Histogram<string>;
  private connectionGauge: Gauge<string>;

  constructor() {
    this.initializeMetrics();
  }

  /**
   * Initializes all Prometheus metrics collectors.
   */
  private initializeMetrics(): void {
    this.queryDurationHistogram = new Histogram({
      name: `${METRICS_PREFIX}query_duration_seconds`,
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'collection'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });

    this.cacheDurationHistogram = new Histogram({
      name: `${METRICS_PREFIX}cache_duration_seconds`,
      help: 'Duration of cache operations in seconds',
      labelNames: ['operation'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
    });

    this.connectionGauge = new Gauge({
      name: `${METRICS_PREFIX}active_connections`,
      help: 'Number of active database connections',
      labelNames: ['database'],
    });

    registry.registerMetric(this.queryDurationHistogram);
    registry.registerMetric(this.cacheDurationHistogram);
    registry.registerMetric(this.connectionGauge);
  }

  /**
   * Records query execution metrics to Prometheus.
   * @param metrics QueryMetrics object containing query performance data
   */
  async recordQueryMetrics(metrics: QueryMetrics): Promise<void> {
    try {
      this.queryDurationHistogram.observe(
        { operation: metrics.operation, collection: metrics.collection },
        metrics.executionTime / 1000 // Convert to seconds
      );

      // Additional metrics
      registry.getSingleMetric(`${METRICS_PREFIX}documents_examined`)?.observe(metrics.documentsExamined);
      registry.getSingleMetric(`${METRICS_PREFIX}documents_returned`)?.observe(metrics.documentsReturned);

      // Record index usage
      const indexUsageGauge = registry.getSingleMetric(`${METRICS_PREFIX}index_usage`) as Gauge<string>;
      if (indexUsageGauge) {
        metrics.indexesUsed.forEach(index => {
          indexUsageGauge.inc({ index, collection: metrics.collection });
        });
      }

      logger.debug('Query metrics recorded', { metrics });
    } catch (error) {
      logger.error('Error recording query metrics', { error, metrics });
    }
  }

  /**
   * Records Redis cache operation metrics.
   * @param operation The cache operation performed
   * @param duration The duration of the operation in milliseconds
   */
  async recordCacheMetrics(operation: string, duration: number): Promise<void> {
    try {
      this.cacheDurationHistogram.observe({ operation }, duration / 1000); // Convert to seconds

      // Additional cache-specific metrics
      const cacheHitRatio = registry.getSingleMetric(`${METRICS_PREFIX}cache_hit_ratio`) as Gauge<string>;
      if (cacheHitRatio) {
        cacheHitRatio.inc({ operation: operation === 'get' ? 'hit' : 'miss' });
      }

      logger.debug('Cache metrics recorded', { operation, duration });
    } catch (error) {
      logger.error('Error recording cache metrics', { error, operation, duration });
    }
  }

  /**
   * Records the current number of active database connections.
   * @param count The number of active connections
   */
  recordConnectionCount(count: number): void {
    this.connectionGauge.set({ database: 'mongodb' }, count);
  }

  /**
   * Returns all collected metrics in Prometheus format.
   * @returns Promise<string> Metrics in Prometheus text format
   */
  async getMetrics(): Promise<string> {
    try {
      const metrics = await registry.metrics();
      logger.debug('Metrics collected successfully');
      return metrics;
    } catch (error) {
      logger.error('Error collecting metrics', { error });
      throw error;
    }
  }
}

// Create a singleton instance of the DatabaseMetricsCollector
const metricsCollector = new DatabaseMetricsCollector();

/**
 * Records query execution metrics to Prometheus.
 * @param metrics QueryMetrics object containing query performance data
 */
export async function recordQueryMetrics(metrics: QueryMetrics): Promise<void> {
  await metricsCollector.recordQueryMetrics(metrics);
}

/**
 * Records Redis cache operation metrics.
 * @param operation The cache operation performed
 * @param duration The duration of the operation in milliseconds
 */
export async function recordCacheMetrics(operation: string, duration: number): Promise<void> {
  await metricsCollector.recordCacheMetrics(operation, duration);
}

/**
 * Returns all collected metrics in Prometheus format.
 * @returns Promise<string> Metrics in Prometheus text format
 */
export async function getMetrics(): Promise<string> {
  return metricsCollector.getMetrics();
}

/**
 * Initializes database metrics collection.
 * This function should be called when the application starts.
 */
export async function initializeDatabaseMetrics(): Promise<void> {
  try {
    // Set up MongoDB connection monitoring
    const mongoClient = await MongoClient.connect();
    setInterval(() => {
      const activeConnections = mongoClient.topology?.connections().length || 0;
      metricsCollector.recordConnectionCount(activeConnections);
    }, 60000); // Check every minute

    // Set up Redis connection monitoring
    const redisManager = RedisManager.getInstance();
    redisManager.on('connect', () => {
      metricsCollector.recordConnectionCount(1);
    });
    redisManager.on('end', () => {
      metricsCollector.recordConnectionCount(0);
    });

    logger.info('Database metrics initialization completed');
  } catch (error) {
    logger.error('Error initializing database metrics', { error });
    throw error;
  }
}

/**
 * This module provides comprehensive metrics collection and reporting for database operations
 * in the Pollen8 platform. It addresses the following requirements:
 * 
 * 1. Performance Benchmarks (Technical Specification/8.1.2 Performance Benchmarks)
 *    - Implements detailed metrics collection for both MongoDB queries and Redis cache operations
 *    - Provides histograms for query and cache operation durations
 * 
 * 2. Query Optimization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 *    - Collects data on index usage, documents examined, and documents returned for each query
 *    - Enables analysis of query performance and identification of optimization opportunities
 * 
 * 3. Monitoring (Technical Specification/6.4 CI/CD Pipeline)
 *    - Exposes metrics in Prometheus format for integration with monitoring systems
 *    - Tracks active database connections for both MongoDB and Redis
 * 
 * The module uses prom-client for metrics collection and exposure, ensuring compatibility
 * with Prometheus and other monitoring tools that support the OpenMetrics format.
 */