import mongoose from 'mongoose';
import winston from 'winston';
import { config } from '../config/index';

// Global variables
const MONGODB_URI: string = config.MONGODB_URI;
const DATABASE_NAME: string = config.DATABASE_NAME;
const MONGODB_OPTIONS: object = config.MONGODB_OPTIONS;

/**
 * Creates and returns a MongoDB connection using mongoose
 * @returns {Promise<mongoose.Connection>} A promise that resolves to a MongoDB connection
 */
export const createConnection = async (): Promise<mongoose.Connection> => {
  try {
    // Set up connection options
    const options = {
      ...MONGODB_OPTIONS,
      dbName: DATABASE_NAME,
    };

    // Create new MongoDB connection
    await mongoose.connect(MONGODB_URI, options);
    const connection = mongoose.connection;

    // Handle connection events
    connection.on('connected', () => {
      winston.info('Successfully connected to MongoDB');
    });

    connection.on('error', (err) => {
      winston.error('MongoDB connection error:', err);
    });

    connection.on('disconnected', () => {
      winston.warn('MongoDB connection disconnected');
    });

    // Return the established connection
    return connection;
  } catch (error) {
    winston.error('Error creating MongoDB connection:', error);
    throw error;
  }
};

/**
 * Returns the existing MongoDB connection or creates a new one if none exists
 * @returns {mongoose.Connection} An existing or new MongoDB connection
 */
export const getConnection = (): mongoose.Connection => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }
  return createConnection();
};

// Export the mongoose instance for use in other parts of the application
export { mongoose };

// Requirements addressed:
// 1. Data Storage - Configure MongoDB connection for storing user profiles, connections, and other data
//    Location: Technical Specification/2.2 High-Level Architecture Diagram
// 2. High Availability - Ensure database configuration supports scalability and reliability
//    Location: Technical Specification/6.1 Deployment Environment
// 3. Data Layer Setup - Establish connection parameters for the Data Layer components
//    Location: Technical Specification/2.1 Programming Languages