import { faker } from '@faker-js/faker';
import { formatPhoneNumber } from './formatting';
import { INDUSTRIES } from '../constants/industries';
import { BASE_CONNECTION_VALUE } from '../constants/networkValue';
import { IUser } from '../interfaces/user.interface';
import { IConnection } from '../interfaces/connection.interface';
import { IInvite } from '../interfaces/invite.interface';

/**
 * Array of test phone numbers for consistent testing
 * @description Provides a set of valid phone numbers for testing purposes
 * @requirements Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 */
export const TEST_PHONE_NUMBERS: string[] = [
  '+14155552671',
  '+14155552672',
  '+14155552673',
  '+14155552674',
  '+14155552675',
];

/**
 * Array of test industries for consistent testing
 * @description Provides a subset of industries for testing purposes
 * @requirements Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus)
 */
export const TEST_INDUSTRIES: string[] = INDUSTRIES.slice(0, 5).map(industry => industry.name);

/**
 * Creates a mock user object with realistic data for testing purposes.
 * @param overrides Partial user object to override default values
 * @returns A mock user object
 * @requirements Verified Connections, Industry Focus (Technical Specification/1.1 System Objectives)
 */
export function createMockUser(overrides: Partial<IUser> = {}): IUser {
  const userId = faker.string.uuid();
  const phoneNumber = faker.helpers.arrayElement(TEST_PHONE_NUMBERS);
  const industries = faker.helpers.arrayElements(TEST_INDUSTRIES, { min: 3, max: 5 });
  
  const mockUser: IUser = {
    _id: userId,
    phoneNumber: formatPhoneNumber(phoneNumber),
    industries,
    interests: faker.helpers.arrayElements(['AI', 'Blockchain', 'IoT', 'Cloud Computing', 'Big Data'], { min: 2, max: 4 }),
    location: {
      city: faker.location.city(),
      zipCode: faker.location.zipCode(),
      coordinates: {
        latitude: parseFloat(faker.location.latitude()),
        longitude: parseFloat(faker.location.longitude()),
      },
    },
    createdAt: faker.date.past(),
    lastActive: faker.date.recent(),
    networkValue: 0, // This will be calculated based on connections
    ...overrides,
  };

  return mockUser;
}

/**
 * Creates a mock connection between two users for testing network functionality.
 * @param userId ID of the first user
 * @param connectedUserId ID of the second user
 * @returns A mock connection object
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 */
export function createMockConnection(userId: string, connectedUserId: string): IConnection {
  const connectionId = faker.string.uuid();
  const sharedIndustries = faker.helpers.arrayElements(TEST_INDUSTRIES, { min: 1, max: 3 });

  const mockConnection: IConnection = {
    _id: connectionId,
    userId,
    connectedUserId,
    sharedIndustries,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };

  return mockConnection;
}

/**
 * Generates a mock invite object for testing invite functionality.
 * @param userId ID of the user creating the invite
 * @returns A mock invite object
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 */
export function createMockInvite(userId: string): IInvite {
  const inviteId = faker.string.uuid();
  const inviteCode = faker.string.alphanumeric(8).toUpperCase();

  const mockInvite: IInvite = {
    _id: inviteId,
    userId,
    name: faker.company.name() + ' Networking Event',
    code: inviteCode,
    clickCount: faker.number.int({ min: 0, max: 100 }),
    dailyClickData: {
      [faker.date.recent().toISOString().split('T')[0]]: faker.number.int({ min: 0, max: 50 }),
      [faker.date.recent().toISOString().split('T')[0]]: faker.number.int({ min: 0, max: 50 }),
    },
    createdAt: faker.date.past(),
    isActive: true,
  };

  return mockInvite;
}

/**
 * Generates a mock SMS verification code for testing authentication flows.
 * @returns A 6-digit verification code as a string
 * @requirements Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 */
export function createMockVerificationCode(): string {
  return faker.string.numeric(6).padStart(6, '0');
}

/**
 * Calculates a mock network value based on the number of connections.
 * @param connections Number of connections
 * @returns Calculated network value
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 */
export function createMockNetworkValue(connections: number): number {
  const value = connections * BASE_CONNECTION_VALUE;
  return parseFloat(value.toFixed(2));
}

/**
 * @fileoverview This module provides testing helpers and mock data generators for consistent and efficient testing across the Pollen8 platform.
 * It addresses the following key requirements:
 * 
 * 1. Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 *    - Implemented TEST_PHONE_NUMBERS and createMockVerificationCode for phone verification testing
 * 
 * 2. Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus)
 *    - Utilized TEST_INDUSTRIES for generating mock industry data
 * 
 * 3. Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 *    - Implemented createMockConnection, createMockInvite, and createMockNetworkValue for testing network-related features
 * 
 * These utilities ensure that tests across the platform use consistent, realistic data that aligns with the system's requirements and constraints.
 */