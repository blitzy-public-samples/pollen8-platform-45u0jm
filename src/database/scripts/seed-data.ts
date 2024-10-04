import mongoose from 'mongoose';
import chalk from 'chalk';
import { UserModel, IUserDocument } from '../models/user.model';
import { IndustryModel } from '../models/industry.model';
import { InterestModel } from '../models/interest.model';
import { createMongoConnection } from '../config/mongodb.config';
import { INDUSTRIES_COLLECTION } from '../constants/collections';

// Global constants
const SEED_USERS_COUNT = 10;
const DEFAULT_INDUSTRIES: string[] = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Manufacturing',
  'Retail',
  'Agriculture',
  'Entertainment',
  'Energy',
  'Transportation'
];
const DEFAULT_INTERESTS: string[] = [
  'Artificial Intelligence',
  'Blockchain',
  'Renewable Energy',
  'Digital Marketing',
  'Data Science',
  'Cybersecurity',
  'E-commerce',
  'Virtual Reality',
  'Biotechnology',
  'Space Exploration'
];

/**
 * Creates and saves predefined industry documents to the database.
 * @returns Promise<mongoose.Types.ObjectId[]> Array of created industry IDs
 * Requirements addressed:
 * - Industry Focus (Technical Specification/1.1 System Objectives)
 * - Data Initialization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
async function seedIndustries(): Promise<mongoose.Types.ObjectId[]> {
  console.log(chalk.blue('Seeding industries...'));
  
  // Clear existing industries
  await IndustryModel.deleteMany({});

  // Create industry documents
  const industryDocs = DEFAULT_INDUSTRIES.map(name => ({
    name,
    description: `${name} industry description`
  }));

  // Save industry documents to database
  const createdIndustries = await IndustryModel.create(industryDocs);
  
  console.log(chalk.green(`Created ${createdIndustries.length} industries`));
  return createdIndustries.map(industry => industry._id);
}

/**
 * Creates and saves predefined interest documents to the database.
 * @returns Promise<mongoose.Types.ObjectId[]> Array of created interest IDs
 * Requirements addressed:
 * - User-Centric Design (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 * - Data Initialization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
async function seedInterests(): Promise<mongoose.Types.ObjectId[]> {
  console.log(chalk.blue('Seeding interests...'));
  
  // Clear existing interests
  await InterestModel.deleteMany({});

  // Create interest documents
  const interestDocs = DEFAULT_INTERESTS.map(name => ({
    name,
    category: 'General'
  }));

  // Save interest documents to database
  const createdInterests = await InterestModel.create(interestDocs);
  
  console.log(chalk.green(`Created ${createdInterests.length} interests`));
  return createdInterests.map(interest => interest._id);
}

/**
 * Creates sample user documents with random selections of industries and interests.
 * @param industryIds Array of industry IDs
 * @param interestIds Array of interest IDs
 * Requirements addressed:
 * - User-Centric Design (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 * - Data Initialization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
async function seedUsers(industryIds: mongoose.Types.ObjectId[], interestIds: mongoose.Types.ObjectId[]): Promise<void> {
  console.log(chalk.blue('Seeding users...'));
  
  // Clear existing users
  await UserModel.deleteMany({});

  // Generate sample user data
  const users: Partial<IUserDocument>[] = [];
  for (let i = 0; i < SEED_USERS_COUNT; i++) {
    const industriesCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 industries
    const interestsCount = Math.floor(Math.random() * 3) + 3; // 3 to 5 interests
    
    users.push({
      phoneNumber: `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      industries: getRandomSubset(industryIds, industriesCount),
      interests: getRandomSubset(interestIds, interestsCount),
      location: {
        city: 'Sample City',
        zipCode: '12345'
      },
      connectionCount: Math.floor(Math.random() * 50), // 0 to 49 connections
    });
  }

  // Create user documents in database
  const createdUsers = await UserModel.create(users);
  console.log(chalk.green(`Created ${createdUsers.length} sample users`));
}

/**
 * Helper function to get a random subset of an array
 * @param array The array to select from
 * @param count The number of items to select
 * @returns A random subset of the array
 */
function getRandomSubset<T>(array: T[], count: number): T[] {
  const shuffled = array.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Orchestrates the entire seeding process, handling connections and error logging.
 * Requirements addressed:
 * - Data Initialization (Technical Specification/2.3.2 Backend Components/DataAccessLayer)
 */
async function main(): Promise<void> {
  try {
    // Establish MongoDB connection
    await createMongoConnection();
    console.log(chalk.green('Connected to MongoDB'));

    // Seed data
    const industryIds = await seedIndustries();
    const interestIds = await seedInterests();
    await seedUsers(industryIds, interestIds);

    console.log(chalk.green.bold('Seeding completed successfully'));
  } catch (error) {
    console.error(chalk.red('Error during seeding:'), error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log(chalk.yellow('Database connection closed'));
  }
}

// Run the seeding process
main().catch(console.error);

/**
 * @fileoverview This script populates the Pollen8 platform's MongoDB database with initial seed data
 * for industries, interests, and sample users to support development and testing.
 * 
 * Requirements addressed:
 * 1. Industry Focus (Technical Specification/1.1 System Objectives): Seed predefined industries for selection
 * 2. Data Initialization (Technical Specification/2.3.2 Backend Components/DataAccessLayer): Provide initial data for testing and development
 * 3. User-Centric Design (Technical Specification/1.2 Scope/User Authentication and Profile Management): Create sample user data for UI testing
 * 
 * The script ensures:
 * - A set of predefined industries and interests are created
 * - Sample users are generated with random selections of industries and interests
 * - Each user has at least 3 industries and interests, as per the technical constraints
 * - The seeding process is idempotent, clearing existing data before inserting new records
 * - Proper error handling and logging for the seeding process
 * 
 * This implementation supports the development and testing phases by providing a consistent
 * and realistic dataset that aligns with the platform's core functionalities and constraints.
 */