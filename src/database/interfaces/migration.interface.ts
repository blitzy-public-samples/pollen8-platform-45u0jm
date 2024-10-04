import { Db } from 'mongodb';
import { IRepository } from './repository.interface';

/**
 * Interface defining the structure for database migrations in the Pollen8 platform.
 * This ensures a consistent and type-safe approach to database schema evolution.
 */
export interface IMigration {
  /**
   * Unique identifier for the migration.
   */
  id: string;

  /**
   * Description of what the migration does.
   */
  description: string;

  /**
   * Method to apply the migration.
   * @param db - MongoDB database instance
   * @returns A Promise that resolves when the migration is complete
   */
  up(db: Db): Promise<void>;

  /**
   * Method to rollback the migration.
   * @param db - MongoDB database instance
   * @returns A Promise that resolves when the rollback is complete
   */
  down(db: Db): Promise<void>;
}

/**
 * Interface defining the context provided to migrations during execution.
 */
export interface IMigrationContext {
  /**
   * MongoDB database instance.
   */
  db: Db;

  /**
   * Logger instance for migration-specific logging.
   */
  logger: ILogger;
}

/**
 * Interface defining the structure for migration execution results.
 */
export interface IMigrationResult {
  /**
   * Indicates whether the migration was successful.
   */
  success: boolean;

  /**
   * ID of the executed migration.
   */
  migrationId: string;

  /**
   * Error object if the migration failed, undefined otherwise.
   */
  error?: Error;

  /**
   * Time taken to execute the migration in milliseconds.
   */
  executionTime: number;
}

/**
 * Type defining the possible directions for migration execution.
 */
export type MigrationDirection = 'up' | 'down';

/**
 * Interface for the logger used in the migration context.
 * This should be implemented by the actual logging system used in the project.
 */
export interface ILogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: Error): void;
}

/**
 * Interface for a migration repository, extending the base IRepository interface.
 */
export interface IMigrationRepository extends IRepository<IMigration> {
  /**
   * Retrieves all migrations in order of their execution.
   * @returns A Promise resolving to an array of migrations
   */
  getAllMigrations(): Promise<IMigration[]>;

  /**
   * Retrieves the last executed migration.
   * @returns A Promise resolving to the last migration or null if no migrations have been executed
   */
  getLastMigration(): Promise<IMigration | null>;

  /**
   * Marks a migration as executed.
   * @param migrationId - The ID of the migration to mark as executed
   * @returns A Promise resolving to the updated migration
   */
  markAsExecuted(migrationId: string): Promise<IMigration>;

  /**
   * Marks a migration as rolled back.
   * @param migrationId - The ID of the migration to mark as rolled back
   * @returns A Promise resolving to the updated migration
   */
  markAsRolledBack(migrationId: string): Promise<IMigration>;
}