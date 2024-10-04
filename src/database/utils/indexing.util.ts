import { Collection, Db, IndexDescription } from 'mongodb';
import { INDEXES, IndexName, IndexDefinition } from '../constants/indexes';

// Since the logging module is not available, we'll create a simple logger
const logger = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  warn: (message: string) => console.warn(`[WARN] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`)
};

/**
 * Represents metrics about index usage and performance
 */
interface IndexMetrics {
  totalIndexSize: number;
  indexUsage: {
    [indexName: string]: {
      operations: number;
      lastUsed: Date;
    };
  };
}

/**
 * Creates specified indexes on a given collection, handling errors and logging
 * @param db MongoDB database instance
 * @param collection Name of the collection
 * @param indexes Array of index descriptions to create
 */
export async function createIndexes(
  db: Db,
  collection: string,
  indexes: IndexDescription[]
): Promise<void> {
  try {
    const coll = db.collection(collection);
    await coll.createIndexes(indexes);
    logger.info(`Successfully created indexes for collection: ${collection}`);
  } catch (error) {
    if (error.name === 'MongoServerError' && error.code === 85) {
      // Index already exists, log a warning
      logger.warn(`Index already exists for collection: ${collection}`);
    } else {
      // Retry logic could be implemented here for other types of errors
      logger.error(`Failed to create indexes for collection: ${collection}`);
      throw error;
    }
  }
}

/**
 * Validates that all required indexes exist on a collection
 * @param collection MongoDB collection
 * @param requiredIndexes Array of required index descriptions
 * @returns True if all required indexes exist
 */
export async function validateIndexes(
  collection: Collection,
  requiredIndexes: IndexDescription[]
): Promise<boolean> {
  const existingIndexes = await collection.indexes();
  const missingIndexes = requiredIndexes.filter(
    (requiredIndex) =>
      !existingIndexes.some(
        (existingIndex) =>
          JSON.stringify(existingIndex.key) === JSON.stringify(requiredIndex.key)
      )
  );

  if (missingIndexes.length > 0) {
    logger.warn(`Missing indexes for collection ${collection.collectionName}: ${JSON.stringify(missingIndexes)}`);
    return false;
  }

  return true;
}

/**
 * Drops specified indexes from a collection
 * @param collection MongoDB collection
 * @param indexNames Array of index names to drop
 */
export async function dropIndexes(
  collection: Collection,
  indexNames: string[]
): Promise<void> {
  for (const indexName of indexNames) {
    try {
      await collection.dropIndex(indexName);
      logger.info(`Successfully dropped index ${indexName} from collection ${collection.collectionName}`);
    } catch (error) {
      logger.error(`Failed to drop index ${indexName} from collection ${collection.collectionName}: ${error.message}`);
    }
  }
}

/**
 * Retrieves metrics about index usage and size
 * @param collection MongoDB collection
 * @returns Metrics about index usage and performance
 */
export async function getIndexMetrics(collection: Collection): Promise<IndexMetrics> {
  const stats = await collection.stats();
  const indexSizes = stats.indexSizes || {};
  const totalIndexSize = Object.values(indexSizes).reduce((sum: number, size: number) => sum + size, 0);

  const indexUsage = await collection.aggregate([
    { $indexStats: {} },
    {
      $project: {
        name: 1,
        operations: '$accesses.ops',
        lastUsed: '$accesses.since'
      }
    }
  ]).toArray();

  const indexUsageMap = indexUsage.reduce((map, index) => {
    map[index.name] = {
      operations: index.operations,
      lastUsed: index.lastUsed
    };
    return map;
  }, {});

  return {
    totalIndexSize,
    indexUsage: indexUsageMap
  };
}

/**
 * Creates all predefined indexes for the Pollen8 platform
 * @param db MongoDB database instance
 */
export async function createAllIndexes(db: Db): Promise<void> {
  for (const indexName in INDEXES) {
    const indexDef: IndexDefinition = INDEXES[indexName as IndexName];
    await createIndexes(db, indexDef.collection, [
      { key: indexDef.key, unique: indexDef.unique }
    ]);
  }
  logger.info('All predefined indexes have been created');
}

/**
 * Validates all predefined indexes for the Pollen8 platform
 * @param db MongoDB database instance
 * @returns True if all predefined indexes exist
 */
export async function validateAllIndexes(db: Db): Promise<boolean> {
  let allValid = true;
  for (const indexName in INDEXES) {
    const indexDef: IndexDefinition = INDEXES[indexName as IndexName];
    const collection = db.collection(indexDef.collection);
    const isValid = await validateIndexes(collection, [
      { key: indexDef.key, unique: indexDef.unique }
    ]);
    if (!isValid) {
      allValid = false;
    }
  }
  return allValid;
}