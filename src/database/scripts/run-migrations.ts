import path from 'path';
import fs from 'fs/promises';
import yargs from 'yargs';
import { IMigration, IMigrationContext, MigrationDirection } from '../interfaces/migration.interface';
import { executeMigration, getMigrationHistory, createMigrationContext, closeMigrationContext } from '../utils/migration.util';
import { createMongoConnection } from '../config/mongodb.config';
import { logger } from '../monitoring/logging';

// Define CLI options
const CLI_OPTIONS = {
  direction: { type: 'string' as const, choices: ['up', 'down'] as const, default: 'up' },
  specific: { type: 'string' as const },
  dryRun: { type: 'boolean' as const, default: false },
};

/**
 * Dynamically loads all migration files from the migrations directory and returns them in order.
 * @returns Promise<IMigration[]> Array of loaded migration objects
 */
async function loadMigrations(): Promise<IMigration[]> {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const migrationFiles = await fs.readdir(migrationsDir);

  // Sort migration files by their numeric prefix
  const sortedFiles = migrationFiles.sort((a, b) => {
    const numA = parseInt(a.split('_')[0], 10);
    const numB = parseInt(b.split('_')[0], 10);
    return numA - numB;
  });

  const migrations: IMigration[] = [];

  for (const file of sortedFiles) {
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      const migrationModule = await import(path.join(migrationsDir, file));
      const migration: IMigration = migrationModule.default;

      // Validate migration object
      if (
        typeof migration.id === 'string' &&
        typeof migration.description === 'string' &&
        typeof migration.up === 'function' &&
        typeof migration.down === 'function'
      ) {
        migrations.push(migration);
      } else {
        logger.warn(`Invalid migration file: ${file}. Skipping.`);
      }
    }
  }

  return migrations;
}

/**
 * Executes all pending migrations in the specified direction.
 * @param direction MigrationDirection The direction to run migrations (up or down)
 * @returns Promise<void> Resolves when all migrations are complete
 */
async function runMigrations(direction: MigrationDirection): Promise<void> {
  const context: IMigrationContext = await createMigrationContext();

  try {
    const allMigrations = await loadMigrations();
    const executedMigrations = await getMigrationHistory(context.db);

    let migrationsToRun: IMigration[];

    if (direction === 'up') {
      migrationsToRun = allMigrations.filter(m => !executedMigrations.includes(m.id));
    } else {
      migrationsToRun = allMigrations
        .filter(m => executedMigrations.includes(m.id))
        .reverse();
    }

    for (const migration of migrationsToRun) {
      logger.info(`Executing migration: ${migration.id} (${direction})`);
      const result = await executeMigration(migration, context, direction);

      if (result.success) {
        logger.info(`Migration ${migration.id} completed successfully in ${result.executionTime}ms`);
      } else {
        logger.error(`Migration ${migration.id} failed:`, result.error);
        break;
      }
    }
  } catch (error) {
    logger.error('Error during migration process:', error as Error);
  } finally {
    await closeMigrationContext(context);
  }
}

/**
 * Main function that parses command-line arguments and orchestrates the migration process.
 * @returns Promise<void> Resolves when migration process is complete
 */
async function main(): Promise<void> {
  const argv = await yargs(process.argv.slice(2))
    .options(CLI_OPTIONS)
    .help()
    .argv;

  const direction = argv.direction as MigrationDirection;
  const specificMigration = argv.specific;
  const dryRun = argv.dryRun;

  logger.info(`Starting migration process. Direction: ${direction}, Specific: ${specificMigration || 'None'}, Dry Run: ${dryRun}`);

  try {
    const connection = await createMongoConnection();
    const db = connection.db();

    if (dryRun) {
      logger.info('Dry run mode. No changes will be applied to the database.');
      const migrations = await loadMigrations();
      logger.info('Available migrations:');
      migrations.forEach(m => logger.info(`- ${m.id}: ${m.description}`));
    } else if (specificMigration) {
      const migrations = await loadMigrations();
      const migration = migrations.find(m => m.id === specificMigration);
      if (migration) {
        const context: IMigrationContext = { db, logger };
        await executeMigration(migration, context, direction);
      } else {
        logger.error(`Specific migration ${specificMigration} not found.`);
      }
    } else {
      await runMigrations(direction);
    }

    await connection.close();
    logger.info('Migration process completed.');
  } catch (error) {
    logger.error('Error in migration process:', error as Error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logger.error('Unhandled error in migration script:', error);
  process.exit(1);
});