import { Document, Collection } from 'mongodb';
import { FilterOptions, QueryOptions, SortOptions } from '../types/query.types';
import { logger } from '../monitoring/logging';

/**
 * Represents metrics collected during query execution
 * 
 * Requirements addressed:
 * - Performance Benchmarks (Technical Specification/8.1.2 Performance Benchmarks)
 */
interface QueryMetrics {
  executionTime: number;
  documentsExamined: number;
  documentsReturned: number;
  indexesUsed: string[];
}

/**
 * Builds a MongoDB query object from the provided filter and options
 * 
 * Requirements addressed:
 * - Query Optimization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 * - Type Safety (Technical Specification/2.1 Programming Languages)
 * 
 * @param filter - The filter options for the query
 * @param options - Additional query options
 * @returns An object containing the constructed query and query options
 */
export function buildQuery<T extends Document>(
  filter: FilterOptions<T>,
  options: QueryOptions
): { query: any; queryOptions: any } {
  // Validate filter parameters
  if (!filter || typeof filter !== 'object') {
    throw new Error('Invalid filter parameter');
  }

  // Convert FilterOptions to MongoDB query syntax
  const query = Object.entries(filter).reduce((acc, [key, value]) => {
    if (typeof value === 'object' && value !== null) {
      if ('$regex' in value) {
        acc[key] = { $regex: new RegExp(value.$regex as string, 'i') };
      } else if ('$in' in value) {
        acc[key] = { $in: value.$in };
      } else if ('$gt' in value || '$lt' in value) {
        acc[key] = {};
        if ('$gt' in value) acc[key].$gt = value.$gt;
        if ('$lt' in value) acc[key].$lt = value.$lt;
      }
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as any);

  // Apply QueryOptions to the query object
  const queryOptions: any = {};
  if (options.sort) queryOptions.sort = options.sort;
  if (options.limit) queryOptions.limit = options.limit;
  if (options.skip) queryOptions.skip = options.skip;
  if (options.projection) queryOptions.projection = options.projection;

  return { query, queryOptions };
}

/**
 * Optimizes a query by analyzing indexes and query patterns
 * 
 * Requirements addressed:
 * - Query Optimization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 * - Performance Benchmarks (Technical Specification/8.1.2 Performance Benchmarks)
 * 
 * @param collection - The MongoDB collection to query
 * @param query - The query object
 * @param options - The query options
 * @returns Optimized query options
 */
export async function optimizeQuery(
  collection: Collection,
  query: any,
  options: QueryOptions
): Promise<QueryOptions> {
  // Analyze available indexes
  const indexes = await collection.indexes();
  const queryFields = Object.keys(query);
  const potentialIndexes = indexes.filter(index => 
    queryFields.some(field => index.key[field])
  );

  // Check query patterns against historical performance (placeholder for future implementation)
  // This could involve analyzing query execution stats stored in a separate collection

  // Adjust query options for optimal performance
  const optimizedOptions: QueryOptions = { ...options };

  if (potentialIndexes.length > 0) {
    // If there are potential indexes, adjust the sort to use them effectively
    const bestIndex = potentialIndexes[0];
    optimizedOptions.sort = Object.keys(bestIndex.key).reduce((acc, key) => {
      acc[key] = bestIndex.key[key];
      return acc;
    }, {} as SortOptions<Document>);
  }

  // Add a hint to use the best index if available
  if (potentialIndexes.length > 0) {
    (optimizedOptions as any).hint = potentialIndexes[0].name;
  }

  return optimizedOptions;
}

/**
 * Executes an optimized query and returns the results
 * 
 * Requirements addressed:
 * - Query Optimization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 * - Performance Benchmarks (Technical Specification/8.1.2 Performance Benchmarks)
 * - Type Safety (Technical Specification/2.1 Programming Languages)
 * 
 * @param collection - The MongoDB collection to query
 * @param filter - The filter options for the query
 * @param options - Additional query options
 * @returns An array of documents matching the query
 */
export async function executeQuery<T extends Document>(
  collection: Collection,
  filter: FilterOptions<T>,
  options: QueryOptions
): Promise<T[]> {
  const startTime = Date.now();

  // Build the query using buildQuery
  const { query, queryOptions } = buildQuery(filter, options);

  // Optimize the query using optimizeQuery
  const optimizedOptions = await optimizeQuery(collection, query, queryOptions);

  // Execute the query against the collection
  const cursor = collection.find(query, optimizedOptions);
  const results = await cursor.toArray() as T[];

  // Collect query metrics
  const endTime = Date.now();
  const executionTime = endTime - startTime;
  const metrics: QueryMetrics = {
    executionTime,
    documentsExamined: await cursor.count(),
    documentsReturned: results.length,
    indexesUsed: (optimizedOptions as any).hint ? [(optimizedOptions as any).hint] : []
  };

  // Log query metrics
  logger.info('Query executed', { 
    collection: collection.collectionName, 
    filter, 
    options: optimizedOptions, 
    metrics 
  });

  return results;
}

/**
 * This module provides advanced query building and optimization functions for MongoDB operations in the Pollen8 platform.
 * It ensures efficient and type-safe database queries, addressing the following requirements:
 * 
 * 1. Query Optimization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 *    - Implements efficient query building and execution through the buildQuery and executeQuery functions
 *    - Optimizes queries based on available indexes and potential query patterns
 * 
 * 2. Type Safety (Technical Specification/2.1 Programming Languages)
 *    - Utilizes TypeScript generics and strict typing to ensure type-safe database operations
 * 
 * 3. Performance Benchmarks (Technical Specification/8.1.2 Performance Benchmarks)
 *    - Collects and logs query metrics to support meeting target response times for database operations
 *    - Provides a foundation for future performance optimizations based on collected metrics
 * 
 * The module is designed to be used by repository classes and services that interact with the MongoDB database,
 * providing a consistent and optimized approach to querying data across the Pollen8 platform.
 */