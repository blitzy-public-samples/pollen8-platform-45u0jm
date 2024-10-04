import { Document } from 'mongodb';

/**
 * FilterOptions: A generic type that defines the structure for filtering documents in database queries.
 * 
 * @template T - Extends Document to ensure compatibility with MongoDB documents
 * 
 * Requirements addressed:
 * - Type-safe Database Operations (Technical Specification/2.1 Programming Languages)
 * - Scalable Data Layer (Technical Specification/2.2 High-Level Architecture Diagram/Data Layer)
 * - Query Optimization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
export type FilterOptions<T extends Document> = {
  [P in keyof T]?: T[P] | { $regex: string } | { $in: T[P][] } | { $gt?: T[P], $lt?: T[P] };
};

/**
 * SortOptions: A generic type that defines the structure for sorting documents in database queries.
 * 
 * @template T - Extends Document to ensure compatibility with MongoDB documents
 * 
 * Requirements addressed:
 * - Type-safe Database Operations (Technical Specification/2.1 Programming Languages)
 * - Scalable Data Layer (Technical Specification/2.2 High-Level Architecture Diagram/Data Layer)
 * - Query Optimization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
export type SortOptions<T extends Document> = {
  [P in keyof T]?: 1 | -1;
};

/**
 * QueryOptions: An interface that defines options for customizing database queries.
 * 
 * Requirements addressed:
 * - Type-safe Database Operations (Technical Specification/2.1 Programming Languages)
 * - Scalable Data Layer (Technical Specification/2.2 High-Level Architecture Diagram/Data Layer)
 * - Query Optimization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
export interface QueryOptions {
  sort?: SortOptions<Document>;
  limit?: number;
  skip?: number;
  projection?: Record<string, 0 | 1>;
}

/**
 * UpdateOptions: An interface that defines options for update operations.
 * 
 * Requirements addressed:
 * - Type-safe Database Operations (Technical Specification/2.1 Programming Languages)
 * - Scalable Data Layer (Technical Specification/2.2 High-Level Architecture Diagram/Data Layer)
 * - Query Optimization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
export interface UpdateOptions {
  upsert?: boolean;
  multi?: boolean;
}

/**
 * These types and interfaces are designed to work seamlessly with MongoDB while providing a layer of abstraction.
 * The use of generics ensures type safety across different models and collections.
 * The FilterOptions type supports various MongoDB query operators like $regex, $in, $gt, and $lt.
 * These types are used extensively by the repository interfaces and implementations throughout the application.
 */