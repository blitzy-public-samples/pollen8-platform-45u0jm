import winston from 'winston';
import { QueryMetrics } from '../utils/query.util';
import { DatabaseMetricsCollector } from './metrics';
import { MongoClient, MongoClientOptions } from 'mongodb';

/**
 * Defines the context structure for database error logging.
 * 
 * Requirements addressed:
 * - Data Layer Logging (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
interface DatabaseErrorContext {
  operation: string;
  collection: string;
  query: any;
  duration: number;
}

/**
 * Configuration options for query logging behavior.
 * 
 * Requirements addressed:
 * - Performance Monitoring (Technical Specification/8.1.2 Performance Benchmarks)
 */
interface QueryLoggerOptions {
  logLevel: string;
  logSlowQueriesOnly: boolean;
  slowQueryThreshold: number;
}

/**
 * A specialized logging module for database operations in the Pollen8 platform,
 * providing detailed, structured logging for monitoring, debugging, and performance analysis of database interactions.
 * 
 * Requirements addressed:
 * - Performance Monitoring (Technical Specification/8.1.2 Performance Benchmarks)
 * - Data Layer Logging (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 * - Debugging Support (Technical Specification/6.5 CI/CD Pipeline)
 */

// Create a Winston logger instance for database operations
export const dbLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'database.log' })
  ]
});

/**
 * Logs detailed information about a database query execution.
 * 
 * @param collection - The name of the collection being queried
 * @param operation - The type of operation (e.g., 'find', 'update', 'insert')
 * @param metrics - The QueryMetrics object containing performance data
 */
export async function logQueryExecution(collection: string, operation: string, metrics: QueryMetrics): Promise<void> {
  const { executionTime, documentsExamined, documentsReturned, indexesUsed } = metrics;
  
  const logEntry = {
    collection,
    operation,
    executionTime,
    documentsExamined,
    documentsReturned,
    indexesUsed,
    timestamp: new Date().toISOString()
  };

  dbLogger.info('Database query executed', logEntry);

  // Asynchronously update metrics
  await DatabaseMetricsCollector.recordQueryMetrics(logEntry);
}

/**
 * Logs database errors with detailed context for debugging.
 * 
 * @param error - The error object
 * @param context - The DatabaseErrorContext object containing error details
 */
export function logDatabaseError(error: Error, context: DatabaseErrorContext): void {
  const { operation, collection, query, duration } = context;
  
  const errorEntry = {
    operation,
    collection,
    query,
    duration,
    errorMessage: error.message,
    errorStack: error.stack,
    timestamp: new Date().toISOString()
  };

  dbLogger.error('Database operation error', errorEntry);

  // Trigger metrics collection for the error
  DatabaseMetricsCollector.recordErrorMetrics(errorEntry);
}

/**
 * Creates a middleware function for logging database queries.
 * 
 * @param options - The QueryLoggerOptions for configuring logging behavior
 * @returns A middleware function for query logging
 */
export function createQueryLogger(options: QueryLoggerOptions): (next: Function) => (args: any[]) => Promise<any> {
  const { logLevel, logSlowQueriesOnly, slowQueryThreshold } = options;

  return (next: Function) => async (args: any[]): Promise<any> => {
    const startTime = Date.now();
    let result;
    try {
      result = await next.apply(this, args);
      const duration = Date.now() - startTime;

      if (!logSlowQueriesOnly || duration > slowQueryThreshold) {
        const [collection, operation] = args;
        const metrics: QueryMetrics = {
          executionTime: duration,
          documentsExamined: result.length || 0,
          documentsReturned: result.length || 0,
          indexesUsed: [] // This would need to be populated from the query plan
        };
        await logQueryExecution(collection, operation, metrics);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const [collection, operation, query] = args;
      logDatabaseError(error, { operation, collection, query, duration });
      throw error;
    }

    return result;
  };
}

/**
 * Enhances the MongoDB client with logging capabilities.
 * 
 * @param client - The MongoDB client to enhance
 * @param options - The QueryLoggerOptions for configuring logging behavior
 * @returns The enhanced MongoDB client
 */
export function enhanceMongoClientWithLogging(client: MongoClient, options: QueryLoggerOptions): MongoClient {
  const queryLogger = createQueryLogger(options);

  const originalDb = client.db.bind(client);
  client.db = function(dbName?: string, options?: MongoClientOptions): any {
    const db = originalDb(dbName, options);
    const originalCollection = db.collection.bind(db);
    db.collection = function(name: string, options?: MongoClientOptions): any {
      const collection = originalCollection(name, options);
      ['find', 'findOne', 'insertOne', 'insertMany', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'].forEach(method => {
        const originalMethod = collection[method].bind(collection);
        collection[method] = queryLogger(originalMethod);
      });
      return collection;
    };
    return db;
  };

  return client;
}

/**
 * This module provides comprehensive logging functionality for database operations in the Pollen8 platform.
 * It addresses the following requirements:
 * 
 * 1. Performance Monitoring (Technical Specification/8.1.2 Performance Benchmarks)
 *    - Implements detailed logging of query execution times and metrics
 *    - Provides options for logging slow queries to identify performance bottlenecks
 * 
 * 2. Data Layer Logging (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 *    - Offers structured logging for all database operations
 *    - Captures relevant context for each database interaction
 * 
 * 3. Debugging Support (Technical Specification/6.5 CI/CD Pipeline)
 *    - Implements error logging with detailed context for efficient troubleshooting
 *    - Provides a query logger middleware for comprehensive operation tracking
 * 
 * The module integrates with the DatabaseMetricsCollector to ensure that all logged data
 * contributes to the overall performance monitoring and analytics of the database layer.
 */