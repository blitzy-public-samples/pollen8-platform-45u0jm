import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import { COLLECTIONS } from '../constants/collections';

// Environment variables
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

/**
 * Creates and establishes a connection to the MongoDB database with proper configuration and error handling.
 * @returns {Promise<mongoose.Connection>} A promise that resolves to a Mongoose connection instance
 */
export async function createMongoConnection(): Promise<mongoose.Connection> {
  if (!MONGODB_URI || !DB_NAME) {
    throw new Error('MongoDB connection string or database name is not defined in environment variables.');
  }

  const connectionOptions: mongoose.ConnectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: DB_NAME,
    // Additional options can be added here based on performance requirements
  };

  try {
    const connection = await mongoose.connect(MONGODB_URI, connectionOptions);
    console.log('Successfully connected to MongoDB');
    return connection.connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    // Implement retry logic with exponential backoff
    // This is a simplified version, consider using a more robust retry mechanism
    await new Promise(resolve => setTimeout(resolve, 5000));
    return createMongoConnection();
  }
}

/**
 * Configures Mongoose settings for optimal performance and behavior.
 * @param {mongoose.Connection} connection - The Mongoose connection instance
 */
export function configureMongoose(connection: mongoose.Connection): void {
  // Disable command buffering
  connection.set('bufferCommands', false);

  // Disable automatic index creation
  connection.set('autoIndex', false);

  // Additional Mongoose settings can be configured here
  // For example:
  // connection.set('maxPoolSize', 100);
  // connection.set('minPoolSize', 5);
}

/**
 * Initializes required collections and indexes in the MongoDB database.
 * @param {MongoClient} client - The MongoDB client instance
 * @returns {Promise<void>} A promise that resolves when initialization is complete
 */
export async function initializeCollections(client: MongoClient): Promise<void> {
  const db = client.db(DB_NAME);

  // Create collections if they don't exist
  for (const collectionName of Object.values(COLLECTIONS)) {
    if (!(await db.listCollections({ name: collectionName }).hasNext())) {
      await db.createCollection(collectionName);
      console.log(`Created collection: ${collectionName}`);
    }
  }

  // Create required indexes
  // Note: In a production environment, consider creating indexes in a separate migration script
  await db.collection(COLLECTIONS.USERS).createIndex({ phoneNumber: 1 }, { unique: true });
  await db.collection(COLLECTIONS.CONNECTIONS).createIndex({ userId: 1, connectedUserId: 1 }, { unique: true });
  await db.collection(COLLECTIONS.INVITES).createIndex({ code: 1 }, { unique: true });

  // Verify all collections and indexes
  const collections = await db.listCollections().toArray();
  console.log('Initialized collections:', collections.map(c => c.name).join(', '));

  const userIndexes = await db.collection(COLLECTIONS.USERS).indexes();
  console.log('User collection indexes:', userIndexes);
}

// Export the MONGODB_URI and DB_NAME for use in other parts of the application if needed
export { MONGODB_URI, DB_NAME };