import { Db, MongoClient } from 'mongodb';
import { IMigration, IMigrationContext, IMigrationResult, MigrationDirection, ILogger } from '../interfaces/migration.interface';
import { createMongoConnection } from '../config/mongodb.config';

// Constants for collection names
const MIGRATION_COLLECTION = 'migrations';
const MIGRATION_LOCK_COLLECTION = 'migrationLocks';

/**
 * Executes a single database migration in the specified direction.
 * @param migration - The migration to execute
 * @param context - The migration context
 * @param direction - The direction of the migration (up or down)
 * @returns A promise resolving to the migration execution result
 */
export async function executeMigration(
  migration: IMigration,
  context: IMigrationContext,
  direction: MigrationDirection
): Promise<IMigrationResult> {
  const startTime = Date.now();
  const { db, logger } = context;

  try {
    // Validate the migration object
    if (!validateMigration(migration)) {
      throw new Error(`Invalid migration object: ${migration.id}`);
    }

    // Attempt to acquire migration lock
    await acquireMigrationLock(db, migration.id);

    // Execute migration in specified direction
    if (direction === 'up') {
      await migration.up(db);
      logger.info(`Migration ${migration.id} executed successfully (up)`);
    } else {
      await migration.down(db);
      logger.info(`Migration ${migration.id} rolled back successfully (down)`);
    }

    // Record migration execution
    await recordMigration(db, migration.id, direction);

    // Release migration lock
    await releaseMigrationLock(db, migration.id);

    const executionTime = Date.now() - startTime;
    return {
      success: true,
      migrationId: migration.id,
      executionTime,
    };
  } catch (error) {
    logger.error(`Error executing migration ${migration.id}:`, error as Error);
    await releaseMigrationLock(db, migration.id);
    return {
      success: false,
      migrationId: migration.id,
      error: error as Error,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Retrieves the list of previously executed migrations from the database.
 * @param db - MongoDB database instance
 * @returns A promise resolving to an array of executed migration IDs
 */
export async function getMigrationHistory(db: Db): Promise<string[]> {
  const migrations = await db
    .collection(MIGRATION_COLLECTION)
    .find({})
    .sort({ executedAt: 1 })
    .toArray();
  return migrations.map((m) => m.id);
}

/**
 * Records the execution of a migration in the migration history collection.
 * @param db - MongoDB database instance
 * @param migrationId - ID of the executed migration
 * @param direction - Direction of the migration (up or down)
 */
async function recordMigration(db: Db, migrationId: string, direction: MigrationDirection): Promise<void> {
  const migrationRecord = {
    id: migrationId,
    direction,
    executedAt: new Date(),
  };
  await db.collection(MIGRATION_COLLECTION).insertOne(migrationRecord);
}

/**
 * Validates that a migration object conforms to the required interface.
 * @param migration - The migration object to validate
 * @returns A boolean indicating whether the migration is valid
 */
function validateMigration(migration: IMigration): boolean {
  return (
    typeof migration.id === 'string' &&
    typeof migration.description === 'string' &&
    typeof migration.up === 'function' &&
    typeof migration.down === 'function'
  );
}

/**
 * Attempts to acquire a lock for executing a migration.
 * @param db - MongoDB database instance
 * @param migrationId - ID of the migration to lock
 */
async function acquireMigrationLock(db: Db, migrationId: string): Promise<void> {
  const result = await db.collection(MIGRATION_LOCK_COLLECTION).updateOne(
    { _id: migrationId },
    { $setOnInsert: { lockedAt: new Date() } },
    { upsert: true }
  );
  if (result.upsertedCount === 0) {
    throw new Error(`Migration ${migrationId} is already in progress`);
  }
}

/**
 * Releases the lock for a migration after execution or in case of an error.
 * @param db - MongoDB database instance
 * @param migrationId - ID of the migration to unlock
 */
async function releaseMigrationLock(db: Db, migrationId: string): Promise<void> {
  await db.collection(MIGRATION_LOCK_COLLECTION).deleteOne({ _id: migrationId });
}

/**
 * Creates a migration context with a database connection and logger.
 * @returns A promise resolving to a migration context
 */
export async function createMigrationContext(): Promise<IMigrationContext> {
  const connection = await createMongoConnection();
  const db = connection.db();
  
  // Create a basic logger (replace with actual logger implementation)
  const logger: ILogger = {
    info: (message: string) => console.log(`[INFO] ${message}`),
    warn: (message: string) => console.warn(`[WARN] ${message}`),
    error: (message: string, error?: Error) => console.error(`[ERROR] ${message}`, error),
  };

  return { db, logger };
}

/**
 * Closes the database connection in the migration context.
 * @param context - The migration context to close
 */
export async function closeMigrationContext(context: IMigrationContext): Promise<void> {
  await (context.db.client as MongoClient).close();
}