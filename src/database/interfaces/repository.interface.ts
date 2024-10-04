import { Document } from 'mongodb';

// These types should be defined in src/database/types/query.types.ts when it's created
interface QueryOptions {}
interface FilterOptions<T> {}
interface UpdateOptions {}

/**
 * A generic interface that defines standard CRUD operations for database repositories.
 * The interface is parameterized with a type T that extends MongoDB's Document type.
 * 
 * @template T - The type of document this repository handles, extending MongoDB's Document type
 */
export interface IRepository<T extends Document> {
  /**
   * Retrieves multiple documents that match the specified filter criteria.
   * 
   * @param filter - The filter criteria to apply
   * @param options - Additional query options
   * @returns A promise that resolves to an array of documents matching the filter criteria
   */
  find(filter: FilterOptions<T>, options?: QueryOptions): Promise<T[]>;

  /**
   * Retrieves a single document that matches the specified filter criteria.
   * 
   * @param filter - The filter criteria to apply
   * @param options - Additional query options
   * @returns A promise that resolves to a single document matching the filter criteria or null if not found
   */
  findOne(filter: FilterOptions<T>, options?: QueryOptions): Promise<T | null>;

  /**
   * Creates a new document in the database.
   * 
   * @param data - The data to create the new document
   * @returns A promise that resolves to the created document
   */
  create(data: Partial<T>): Promise<T>;

  /**
   * Updates documents that match the specified filter criteria.
   * 
   * @param filter - The filter criteria to apply
   * @param data - The data to update
   * @param options - Additional update options
   * @returns A promise that resolves to the updated document
   */
  update(filter: FilterOptions<T>, data: Partial<T>, options?: UpdateOptions): Promise<T>;

  /**
   * Deletes documents that match the specified filter criteria.
   * 
   * @param filter - The filter criteria to apply
   * @returns A promise that resolves to true if deletion was successful, false otherwise
   */
  delete(filter: FilterOptions<T>): Promise<boolean>;

  /**
   * Counts the number of documents that match the specified filter criteria.
   * 
   * @param filter - The filter criteria to apply
   * @returns A promise that resolves to the number of documents matching the filter criteria
   */
  count(filter: FilterOptions<T>): Promise<number>;
}