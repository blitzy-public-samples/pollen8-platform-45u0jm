import { Db } from 'mongodb';
import { IMigration } from '../interfaces/migration.interface';
import { createIndexes, dropIndexes } from '../utils/indexing.util';
import {
  USER_PHONE_INDEX,
  USER_LOCATION_INDEX,
  CONNECTION_USER_INDEX,
  CONNECTION_INDUSTRY_INDEX,
  INVITE_CODE_INDEX,
  INVITE_USER_INDEX
} from '../constants/indexes';

/**
 * Migration: Add Essential Indexes
 * 
 * This migration implements the creation of essential database indexes for the Pollen8 platform,
 * optimizing query performance and ensuring data integrity for the core collections.
 * 
 * Requirements addressed:
 * 1. Database Performance (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 * 2. Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 * 3. Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus)
 * 4. Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 */
export class AddIndexesMigration implements IMigration {
  public id: string = '00002';
  public description: string = 'Add essential indexes for users, connections, and invites collections';

  /**
   * Applies the migration by creating all required indexes.
   * @param db MongoDB database instance
   */
  public async up(db: Db): Promise<void> {
    console.log('Starting migration: Adding essential indexes');

    try {
      // Create user indexes
      await createIndexes(db, USER_PHONE_INDEX.collection, [
        { key: USER_PHONE_INDEX.key, unique: USER_PHONE_INDEX.unique }
      ]);
      await createIndexes(db, USER_LOCATION_INDEX.collection, [
        { key: USER_LOCATION_INDEX.key }
      ]);

      // Create connection indexes
      await createIndexes(db, CONNECTION_USER_INDEX.collection, [
        { key: CONNECTION_USER_INDEX.key }
      ]);
      await createIndexes(db, CONNECTION_INDUSTRY_INDEX.collection, [
        { key: CONNECTION_INDUSTRY_INDEX.key }
      ]);

      // Create invite indexes
      await createIndexes(db, INVITE_CODE_INDEX.collection, [
        { key: INVITE_CODE_INDEX.key, unique: INVITE_CODE_INDEX.unique }
      ]);
      await createIndexes(db, INVITE_USER_INDEX.collection, [
        { key: INVITE_USER_INDEX.key }
      ]);

      console.log('Migration completed: All essential indexes have been added');
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }

  /**
   * Reverts the migration by dropping all created indexes.
   * @param db MongoDB database instance
   */
  public async down(db: Db): Promise<void> {
    console.log('Starting rollback: Removing essential indexes');

    try {
      // Drop user indexes
      await dropIndexes(db.collection(USER_PHONE_INDEX.collection), ['phoneNumber_1']);
      await dropIndexes(db.collection(USER_LOCATION_INDEX.collection), ['zipCode_1']);

      // Drop connection indexes
      await dropIndexes(db.collection(CONNECTION_USER_INDEX.collection), ['userId_1_connectedUserId_1']);
      await dropIndexes(db.collection(CONNECTION_INDUSTRY_INDEX.collection), ['sharedIndustries_1']);

      // Drop invite indexes
      await dropIndexes(db.collection(INVITE_CODE_INDEX.collection), ['code_1']);
      await dropIndexes(db.collection(INVITE_USER_INDEX.collection), ['userId_1']);

      console.log('Rollback completed: All essential indexes have been removed');
    } catch (error) {
      console.error('Error during rollback:', error);
      throw error;
    }
  }
}