import {
  formatPhoneNumber,
  formatNetworkValue,
  formatDate,
  formatIndustryList,
  formatNumberWithCommas
} from '../utils/formatting';
import {
  validatePhoneNumber,
  validateIndustries,
  validateInterests,
  validateLocation,
  validateUserCreate,
  validateUserUpdate
} from '../utils/validation';
import {
  calculateNetworkValue,
  calculateIndustryNetworks,
  generateNetworkGraphData,
  calculateNetworkGrowthRate
} from '../utils/networkCalculation';
import {
  createMockUser,
  createMockConnection,
  createMockInvite,
  createMockVerificationCode,
  createMockNetworkValue,
  TEST_PHONE_NUMBERS,
  TEST_INDUSTRIES
} from '../utils/testing';
import { BASE_CONNECTION_VALUE } from '../constants/networkValue';
import { ValidationErrors } from '../constants/errorCodes';

describe('Formatting Utils', () => {
  // Test formatPhoneNumber
  test('formatPhoneNumber formats phone numbers correctly', () => {
    expect(formatPhoneNumber('+14155552671')).toBe('+14155552671');
    expect(formatPhoneNumber('(415) 555-2671')).toBe('+14155552671');
    expect(formatPhoneNumber('415-555-2671')).toBe('+14155552671');
  });

  // Test formatNetworkValue
  test('formatNetworkValue calculates and formats network value correctly', () => {
    expect(formatNetworkValue(10)).toBe('31.40');
    expect(formatNetworkValue(5)).toBe('15.70');
    expect(formatNetworkValue(0)).toBe('0.00');
  });

  // Test formatDate
  test('formatDate formats dates correctly', () => {
    const testDate = new Date('2023-09-15T12:00:00Z');
    expect(formatDate(testDate)).toBe('Sep 15, 2023');
    expect(formatDate(testDate, 'yyyy-MM-dd')).toBe('2023-09-15');
  });

  // Test formatIndustryList
  test('formatIndustryList formats industry lists correctly', () => {
    expect(formatIndustryList(['Tech'])).toBe('Tech');
    expect(formatIndustryList(['Tech', 'Finance'])).toBe('Tech and Finance');
    expect(formatIndustryList(['Tech', 'Finance', 'Healthcare'])).toBe('Tech, Finance, and Healthcare');
  });

  // Test formatNumberWithCommas
  test('formatNumberWithCommas formats numbers with commas correctly', () => {
    expect(formatNumberWithCommas(1000)).toBe('1,000');
    expect(formatNumberWithCommas(1000000)).toBe('1,000,000');
    expect(formatNumberWithCommas(1234567.89)).toBe('1,234,567.89');
  });
});

describe('Validation Utils', () => {
  // Test validatePhoneNumber
  test('validatePhoneNumber validates phone numbers correctly', () => {
    expect(validatePhoneNumber('+14155552671').isValid).toBe(true);
    expect(validatePhoneNumber('invalid').isValid).toBe(false);
  });

  // Test validateIndustries
  test('validateIndustries validates industry selections correctly', () => {
    expect(validateIndustries(['Tech', 'Finance', 'Healthcare']).isValid).toBe(true);
    expect(validateIndustries(['Tech']).isValid).toBe(false);
  });

  // Test validateInterests
  test('validateInterests validates interest selections correctly', () => {
    expect(validateInterests(['AI', 'Blockchain', 'IoT']).isValid).toBe(true);
    expect(validateInterests(['AI']).isValid).toBe(false);
  });

  // Test validateLocation
  test('validateLocation validates location data correctly', () => {
    expect(validateLocation({ city: 'San Francisco', zipCode: '94105' }).isValid).toBe(true);
    expect(validateLocation({ city: 'San Francisco', zipCode: 'invalid' }).isValid).toBe(false);
  });

  // Test validateUserCreate
  test('validateUserCreate performs comprehensive user creation validation', () => {
    const validUser = createMockUser();
    const invalidUser = { ...validUser, phoneNumber: 'invalid' };
    
    expect(validateUserCreate(validUser).isValid).toBe(true);
    expect(validateUserCreate(invalidUser).isValid).toBe(false);
  });

  // Test validateUserUpdate
  test('validateUserUpdate validates user update data correctly', () => {
    const validUpdate = { industries: TEST_INDUSTRIES.slice(0, 3) };
    const invalidUpdate = { industries: ['Tech'] };
    
    expect(validateUserUpdate(validUpdate).isValid).toBe(true);
    expect(validateUserUpdate(invalidUpdate).isValid).toBe(false);
  });
});

describe('Network Calculation Utils', () => {
  // Test calculateNetworkValue
  test('calculateNetworkValue calculates network value correctly', () => {
    const connections = [
      createMockConnection('user1', 'user2'),
      createMockConnection('user1', 'user3'),
      createMockConnection('user1', 'user4')
    ];
    expect(calculateNetworkValue(connections)).toBe(3 * BASE_CONNECTION_VALUE);
  });

  // Test calculateIndustryNetworks
  test('calculateIndustryNetworks calculates industry-specific network stats', () => {
    const connections = [
      { ...createMockConnection('user1', 'user2'), sharedIndustries: ['Tech', 'Finance'] },
      { ...createMockConnection('user1', 'user3'), sharedIndustries: ['Tech', 'Healthcare'] }
    ];
    const stats = calculateIndustryNetworks(connections);
    expect(stats['Tech'].totalConnections).toBe(2);
    expect(stats['Finance'].totalConnections).toBe(1);
    expect(stats['Healthcare'].totalConnections).toBe(1);
  });

  // Test generateNetworkGraphData
  test('generateNetworkGraphData generates correct graph data structure', () => {
    const users = [createMockUser(), createMockUser()];
    const connections = [createMockConnection(users[0]._id, users[1]._id)];
    const graphData = generateNetworkGraphData(connections, users);
    expect(graphData.nodes.length).toBe(2);
    expect(graphData.links.length).toBe(1);
  });

  // Test calculateNetworkGrowthRate
  test('calculateNetworkGrowthRate calculates growth rate correctly', () => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const connections = [
      { ...createMockConnection('user1', 'user2'), createdAt: now },
      { ...createMockConnection('user1', 'user3'), createdAt: oneMonthAgo }
    ];
    const growthRate = calculateNetworkGrowthRate(connections, 30);
    expect(growthRate).toBeGreaterThan(0);
  });
});

describe('Testing Utils', () => {
  // Test createMockUser
  test('createMockUser generates valid mock user data', () => {
    const mockUser = createMockUser();
    expect(mockUser.phoneNumber).toBeDefined();
    expect(mockUser.industries.length).toBeGreaterThanOrEqual(3);
    expect(mockUser.interests.length).toBeGreaterThanOrEqual(2);
  });

  // Test createMockConnection
  test('createMockConnection generates valid mock connection data', () => {
    const connection = createMockConnection('user1', 'user2');
    expect(connection.userId).toBe('user1');
    expect(connection.connectedUserId).toBe('user2');
    expect(connection.sharedIndustries.length).toBeGreaterThanOrEqual(1);
  });

  // Test createMockInvite
  test('createMockInvite generates valid mock invite data', () => {
    const invite = createMockInvite('user1');
    expect(invite.userId).toBe('user1');
    expect(invite.code).toBeDefined();
    expect(invite.clickCount).toBeGreaterThanOrEqual(0);
  });

  // Test createMockVerificationCode
  test('createMockVerificationCode generates valid verification code', () => {
    const code = createMockVerificationCode();
    expect(code.length).toBe(6);
    expect(Number(code)).toBeGreaterThanOrEqual(0);
    expect(Number(code)).toBeLessThanOrEqual(999999);
  });

  // Test createMockNetworkValue
  test('createMockNetworkValue calculates mock network value correctly', () => {
    expect(createMockNetworkValue(10)).toBe(10 * BASE_CONNECTION_VALUE);
    expect(createMockNetworkValue(5)).toBe(5 * BASE_CONNECTION_VALUE);
  });

  // Test TEST_PHONE_NUMBERS
  test('TEST_PHONE_NUMBERS contains valid phone numbers', () => {
    TEST_PHONE_NUMBERS.forEach(number => {
      expect(validatePhoneNumber(number).isValid).toBe(true);
    });
  });

  // Test TEST_INDUSTRIES
  test('TEST_INDUSTRIES contains valid industries', () => {
    expect(TEST_INDUSTRIES.length).toBeGreaterThanOrEqual(5);
    expect(validateIndustries(TEST_INDUSTRIES.slice(0, 3)).isValid).toBe(true);
  });
});

/**
 * @fileoverview This test suite covers the shared utility functions used across the Pollen8 platform.
 * It ensures the reliability and correctness of common operations related to formatting, validation,
 * network calculations, and testing utilities.
 * 
 * Key requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 *    - Tests phone number formatting and validation
 * 2. Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 *    - Verifies network value calculations and growth tracking
 * 3. User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 *    - Ensures consistent data formatting for improved user experience
 * 4. Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus)
 *    - Tests industry-related validations and calculations
 */