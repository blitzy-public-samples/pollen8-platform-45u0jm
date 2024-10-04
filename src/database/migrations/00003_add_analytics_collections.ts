import { Db, Collection } from 'mongodb';
import { IMigration } from '../interfaces/migration.interface';
import { COLLECTIONS } from '../constants/collections';

/**
 * Migration to add analytics collections for the Pollen8 platform.
 * This migration implements the creation of analytics collections,
 * enabling quantifiable networking features and data-driven insights.
 * 
 * Requirements addressed:
 * 1. Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 * 2. Analytics-Driven Insights (Technical Specification/1.2 Scope/Core Functionalities/Invitation System)
 * 3. Growth Tracking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 * 4. Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 */
export class AddAnalyticsCollectionsMigration implements IMigration {
  public readonly id: string = '00003_add_analytics_collections';
  public readonly description: string = 'Adds analytics collections for quantifiable networking features';

  /**
   * Creates analytics collections and sets up necessary indexes.
   * @param db - MongoDB database instance
   * @returns Promise<void> - Resolves when migration is complete
   */
  public async up(db: Db): Promise<void> {
    const collections = {
      networkValueHistory: await db.createCollection('network_value_history'),
      inviteAnalytics: await db.createCollection('invite_analytics'),
      connectionAnalytics: await db.createCollection('connection_analytics')
    };

    await this.createIndexes(collections);
    await this.verifyCollections(db);
  }

  /**
   * Removes all analytics collections created by this migration.
   * @param db - MongoDB database instance
   * @returns Promise<void> - Resolves when rollback is complete
   */
  public async down(db: Db): Promise<void> {
    await db.dropCollection('network_value_history');
    await db.dropCollection('invite_analytics');
    await db.dropCollection('connection_analytics');

    await this.verifyCollectionsDropped(db);
  }

  /**
   * Creates indexes for efficient data retrieval in analytics collections.
   * @param collections - Object containing references to created collections
   */
  private async createIndexes(collections: { [key: string]: Collection }): Promise<void> {
    await collections.networkValueHistory.createIndex({ userId: 1, timestamp: -1 });
    await collections.inviteAnalytics.createIndex({ inviteId: 1, date: -1 });
    await collections.connectionAnalytics.createIndex({ userId: 1, date: -1 });
  }

  /**
   * Verifies that all required collections are created successfully.
   * @param db - MongoDB database instance
   */
  private async verifyCollections(db: Db): Promise<void> {
    const collectionNames = await db.listCollections().toArray();
    const requiredCollections = ['network_value_history', 'invite_analytics', 'connection_analytics'];

    for (const collectionName of requiredCollections) {
      if (!collectionNames.some(col => col.name === collectionName)) {
        throw new Error(`Failed to create collection: ${collectionName}`);
      }
    }
  }

  /**
   * Verifies that all analytics collections are successfully removed during rollback.
   * @param db - MongoDB database instance
   */
  private async verifyCollectionsDropped(db: Db): Promise<void> {
    const collectionNames = await db.listCollections().toArray();
    const droppedCollections = ['network_value_history', 'invite_analytics', 'connection_analytics'];

    for (const collectionName of droppedCollections) {
      if (collectionNames.some(col => col.name === collectionName)) {
        throw new Error(`Failed to drop collection: ${collectionName}`);
      }
    }
  }
}