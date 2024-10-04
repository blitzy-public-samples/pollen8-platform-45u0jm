import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';
import { jest } from '@jest/globals';
import { IMigration, IMigrationContext, IMigrationResult } from '../interfaces/migration.interface';
import { executeMigration, getMigrationHistory, createMigrationContext, closeMigrationContext } from '../utils/migration.util';
import { InitialSchemaMigration } from '../migrations/00001_initial_schema';
import { AddIndexesMigration } from '../migrations/00002_add_indexes';
import { AddAnalyticsCollectionsMigration } from '../migrations/00003_add_analytics_collections';

describe('Migration Execution Tests', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let context: IMigrationContext;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    client = await MongoClient.connect(mongoUri);
    db = client.db();
    context = await createMigrationContext();
    context.db = db; // Override the db with our in-memory instance
  });

  afterAll(async () => {
    await closeMigrationContext(context);
    await client.close();
    await mongoServer.stop();
  });

  test('should execute initial schema migration successfully', async () => {
    const migration = new InitialSchemaMigration();
    const result = await executeMigration(migration, context, 'up');
    expect(result.success).toBe(true);
    expect(result.migrationId).toBe(migration.id);
  });

  test('should create all required collections', async () => {
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    expect(collectionNames).toContain('users');
    expect(collectionNames).toContain('connections');
    expect(collectionNames).toContain('invites');
    expect(collectionNames).toContain('industries');
    expect(collectionNames).toContain('interests');
    expect(collectionNames).toContain('locations');
  });

  test('should create indexes correctly', async () => {
    const migration = new AddIndexesMigration();
    const result = await executeMigration(migration, context, 'up');
    expect(result.success).toBe(true);

    const userIndexes = await db.collection('users').indexes();
    expect(userIndexes.some(index => index.name === 'phoneNumber_1')).toBe(true);

    const connectionIndexes = await db.collection('connections').indexes();
    expect(connectionIndexes.some(index => index.name === 'userId_1_connectedUserId_1')).toBe(true);
  });

  test('should add analytics collections', async () => {
    const migration = new AddAnalyticsCollectionsMigration();
    const result = await executeMigration(migration, context, 'up');
    expect(result.success).toBe(true);

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    expect(collectionNames).toContain('networkAnalytics');
    expect(collectionNames).toContain('inviteAnalytics');
  });
});

describe('Migration Rollback Tests', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let context: IMigrationContext;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    client = await MongoClient.connect(mongoUri);
    db = client.db();
    context = await createMigrationContext();
    context.db = db; // Override the db with our in-memory instance
  });

  afterAll(async () => {
    await closeMigrationContext(context);
    await client.close();
    await mongoServer.stop();
  });

  test('should rollback initial schema migration', async () => {
    const migration = new InitialSchemaMigration();
    await executeMigration(migration, context, 'up');
    const rollbackResult = await executeMigration(migration, context, 'down');
    expect(rollbackResult.success).toBe(true);

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    expect(collectionNames).not.toContain('users');
    expect(collectionNames).not.toContain('connections');
    expect(collectionNames).not.toContain('invites');
  });

  test('should remove all indexes on rollback', async () => {
    const migration = new AddIndexesMigration();
    await executeMigration(migration, context, 'up');
    const rollbackResult = await executeMigration(migration, context, 'down');
    expect(rollbackResult.success).toBe(true);

    const userIndexes = await db.collection('users').indexes();
    expect(userIndexes.length).toBe(1); // Only the _id index should remain

    const connectionIndexes = await db.collection('connections').indexes();
    expect(connectionIndexes.length).toBe(1); // Only the _id index should remain
  });

  test('should remove analytics collections on rollback', async () => {
    const migration = new AddAnalyticsCollectionsMigration();
    await executeMigration(migration, context, 'up');
    const rollbackResult = await executeMigration(migration, context, 'down');
    expect(rollbackResult.success).toBe(true);

    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    expect(collectionNames).not.toContain('networkAnalytics');
    expect(collectionNames).not.toContain('inviteAnalytics');
  });
});

describe('Migration Utility Tests', () => {
  let mongoServer: MongoMemoryServer;
  let client: MongoClient;
  let db: Db;
  let context: IMigrationContext;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    client = await MongoClient.connect(mongoUri);
    db = client.db();
    context = await createMigrationContext();
    context.db = db; // Override the db with our in-memory instance
  });

  afterAll(async () => {
    await closeMigrationContext(context);
    await client.close();
    await mongoServer.stop();
  });

  test('should record migration history correctly', async () => {
    const migration = new InitialSchemaMigration();
    await executeMigration(migration, context, 'up');

    const history = await getMigrationHistory(db);
    expect(history).toContain(migration.id);
  });

  test('should prevent duplicate migration execution', async () => {
    const migration = new InitialSchemaMigration();
    await executeMigration(migration, context, 'up');
    const duplicateResult = await executeMigration(migration, context, 'up');

    expect(duplicateResult.success).toBe(false);
    expect(duplicateResult.error).toBeDefined();
  });

  test('should handle migration errors gracefully', async () => {
    const errorMigration: IMigration = {
      id: 'error_migration',
      description: 'This migration always fails',
      up: async () => { throw new Error('Intentional error'); },
      down: async () => { },
    };

    const result = await executeMigration(errorMigration, context, 'up');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// Mock implementations
jest.mock('../migrations/00001_initial_schema', () => ({
  InitialSchemaMigration: class {
    id = '00001_initial_schema';
    description = 'Initial schema migration';
    up = jest.fn(async (db: Db) => {
      await db.createCollection('users');
      await db.createCollection('connections');
      await db.createCollection('invites');
    });
    down = jest.fn(async (db: Db) => {
      await db.dropCollection('users');
      await db.dropCollection('connections');
      await db.dropCollection('invites');
    });
  }
}));

jest.mock('../migrations/00002_add_indexes', () => ({
  AddIndexesMigration: class {
    id = '00002_add_indexes';
    description = 'Add indexes to collections';
    up = jest.fn(async (db: Db) => {
      await db.collection('users').createIndex({ phoneNumber: 1 }, { unique: true });
      await db.collection('connections').createIndex({ userId: 1, connectedUserId: 1 });
    });
    down = jest.fn(async (db: Db) => {
      await db.collection('users').dropIndex('phoneNumber_1');
      await db.collection('connections').dropIndex('userId_1_connectedUserId_1');
    });
  }
}));

jest.mock('../migrations/00003_add_analytics_collections', () => ({
  AddAnalyticsCollectionsMigration: class {
    id = '00003_add_analytics_collections';
    description = 'Add analytics collections';
    up = jest.fn(async (db: Db) => {
      await db.createCollection('networkAnalytics');
      await db.createCollection('inviteAnalytics');
    });
    down = jest.fn(async (db: Db) => {
      await db.dropCollection('networkAnalytics');
      await db.dropCollection('inviteAnalytics');
    });
  }
}));