import { Db } from 'mongodb';
import { IMigration } from '../interfaces/migration.interface';
import { COLLECTIONS } from '../constants/collections';

/**
 * InitialSchemaMigration implements the initial database schema migration for the Pollen8 platform,
 * establishing the foundational data structures for users, connections, industries, interests, invites, and locations.
 * 
 * Requirements addressed:
 * 1. Database Schema Evolution (Technical Specification/2.2 High-Level Architecture Diagram/Data Layer)
 * 2. Data Integrity (Technical Specification/6.1 Deployment Environment)
 * 3. Multi-Industry Selection (Technical Specification/1.1 System Objectives/Industry Focus)
 * 4. Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 */
export class InitialSchemaMigration implements IMigration {
  public readonly id: string = '00001_initial_schema';
  public readonly description: string = 'Creates the initial collections and indexes for the Pollen8 platform.';

  /**
   * Creates the initial collections and indexes for the database schema.
   * @param db - MongoDB database instance
   * @returns Promise that resolves when migration is complete
   */
  public async up(db: Db): Promise<void> {
    // Create users collection with indexes
    await db.createCollection(COLLECTIONS.USERS);
    await db.collection(COLLECTIONS.USERS).createIndex({ phoneNumber: 1 }, { unique: true });
    await db.collection(COLLECTIONS.USERS).createIndex({ zipCode: 1 });

    // Create connections collection with indexes
    await db.createCollection(COLLECTIONS.CONNECTIONS);
    await db.collection(COLLECTIONS.CONNECTIONS).createIndex({ userId: 1, connectedUserId: 1 }, { unique: true });

    // Create industries collection with indexes
    await db.createCollection(COLLECTIONS.INDUSTRIES);
    await db.collection(COLLECTIONS.INDUSTRIES).createIndex({ name: 1 }, { unique: true });

    // Create interests collection with indexes
    await db.createCollection(COLLECTIONS.INTERESTS);
    await db.collection(COLLECTIONS.INTERESTS).createIndex({ name: 1 }, { unique: true });

    // Create invites collection with indexes
    await db.createCollection(COLLECTIONS.INVITES);
    await db.collection(COLLECTIONS.INVITES).createIndex({ code: 1 }, { unique: true });
    await db.collection(COLLECTIONS.INVITES).createIndex({ userId: 1 });

    // Create locations collection with indexes
    await db.createCollection(COLLECTIONS.LOCATIONS);
    await db.collection(COLLECTIONS.LOCATIONS).createIndex({ zipCode: 1 }, { unique: true });
  }

  /**
   * Removes all collections created by this migration.
   * @param db - MongoDB database instance
   * @returns Promise that resolves when rollback is complete
   */
  public async down(db: Db): Promise<void> {
    // Drop all collections in reverse order of creation
    await db.dropCollection(COLLECTIONS.LOCATIONS);
    await db.dropCollection(COLLECTIONS.INVITES);
    await db.dropCollection(COLLECTIONS.INTERESTS);
    await db.dropCollection(COLLECTIONS.INDUSTRIES);
    await db.dropCollection(COLLECTIONS.CONNECTIONS);
    await db.dropCollection(COLLECTIONS.USERS);
  }
}