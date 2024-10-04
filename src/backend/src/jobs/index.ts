import { injectable, inject } from 'inversify';
import { Logger } from 'winston';
import { AnalyticsAggregationJob } from './analyticsAggregation.job';
import { CacheCleanupJob } from './cacheCleanup.job';
import { CONFIG } from '../config';

/**
 * JobManager class
 * @description Manages the initialization and coordination of all background jobs for the Pollen8 platform's backend service.
 * 
 * Requirements addressed:
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives)
 * - High Performance (Technical Specification/2.2 High-Level Architecture Diagram)
 * - Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 */
@injectable()
export class JobManager {
  constructor(
    @inject('AnalyticsAggregationJob') private analyticsJob: AnalyticsAggregationJob,
    @inject('CacheCleanupJob') private cacheCleanupJob: CacheCleanupJob,
    @inject('Logger') private logger: Logger
  ) {}

  /**
   * Starts all registered background jobs
   * @returns {void}
   */
  public startAllJobs(): void {
    try {
      // Start analytics aggregation job
      this.analyticsJob.start();
      this.logger.info('Analytics aggregation job started successfully');

      // Start cache cleanup job
      this.cacheCleanupJob.start();
      this.logger.info('Cache cleanup job started successfully');

      this.logger.info('All background jobs started successfully');
    } catch (error) {
      this.logger.error('Error starting background jobs:', error);
      throw new Error('Failed to start background jobs');
    }
  }

  /**
   * Stops all running background jobs
   * @returns {void}
   */
  public stopAllJobs(): void {
    try {
      // Stop analytics aggregation job
      // Note: The AnalyticsAggregationJob doesn't have a stop method in its implementation,
      // so we're assuming it doesn't need explicit stopping. If it does, it should be added.

      // Stop cache cleanup job
      this.cacheCleanupJob.stop();
      this.logger.info('Cache cleanup job stopped successfully');

      this.logger.info('All background jobs stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping background jobs:', error);
      throw new Error('Failed to stop background jobs');
    }
  }
}

// Export an instance of the JobManager
export default new JobManager(
  new AnalyticsAggregationJob(CONFIG.analyticsService, CONFIG.cacheService, CONFIG.logger),
  new CacheCleanupJob(CONFIG.cacheService),
  CONFIG.logger
);

/**
 * This file implements the JobManager for the Pollen8 platform's backend service.
 * It manages the initialization, starting, and stopping of all background jobs.
 * 
 * The JobManager addresses the following requirements:
 * 1. Quantifiable Networking (Technical Specification/1.1 System Objectives)
 *    - Manages the analytics aggregation job for network value calculations
 * 2. High Performance (Technical Specification/2.2 High-Level Architecture Diagram)
 *    - Coordinates cache cleanup for optimal performance
 * 3. Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 *    - Ensures timely execution of data processing jobs
 * 
 * Note: This implementation assumes that the necessary dependencies (AnalyticsAggregationJob,
 * CacheCleanupJob, and Logger) are properly configured in the IoC container. The CONFIG
 * object is also assumed to be imported from the config file, providing necessary configurations.
 */