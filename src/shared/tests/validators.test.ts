import { describe, it, expect } from 'jest';
import { UserValidator } from '../validators/user.validator';
import { validateConnection, validateConnectionCreate, validateConnectionUpdate, validateSharedIndustries, calculateNetworkValue } from '../validators/connection.validator';
import { validateInviteCreate, validateInviteUpdate, validateInviteCode } from '../validators/invite.validator';
import { IUserCreate, IUserUpdate } from '../interfaces/user.interface';
import { IConnection, IConnectionCreate } from '../interfaces/connection.interface';
import { IInviteCreate, IInviteUpdate } from '../interfaces/invite.interface';
import { ConnectionStatus } from '../enums/connectionStatus.enum';
import { NETWORK_VALUE_PER_CONNECTION } from '../constants/networkValue';

/**
 * This test suite validates the functionality of all validator modules in the Pollen8 platform,
 * ensuring data integrity and adherence to business rules.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives)
 * - Industry Focus (Technical Specification/1.2 Scope/Limitations and Constraints)
 * - Invitation System (Technical Specification/1.2 Scope/Core Functionalities/3)
 */

describe('UserValidator Tests', () => {
  const generateMockUserData = (): IUserCreate => ({
    phoneNumber: '+1234567890',
    industries: ['Technology', 'Finance', 'Education'],
    interests: ['AI', 'Blockchain', 'EdTech'],
    location: {
      city: 'New York',
      zipCode: '10001'
    }
  });

  it('should validate valid user creation data', () => {
    const mockData = generateMockUserData();
    const result = UserValidator.validateCreate(mockData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should reject invalid phone numbers', () => {
    const mockData = generateMockUserData();
    mockData.phoneNumber = 'invalid';
    const result = UserValidator.validateCreate(mockData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'phoneNumber',
      code: expect.any(String),
      message: expect.any(String)
    }));
  });

  it('should enforce minimum industry requirement', () => {
    const mockData = generateMockUserData();
    mockData.industries = ['Technology'];
    const result = UserValidator.validateCreate(mockData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(expect.objectContaining({
      field: 'industries',
      code: expect.any(String),
      message: expect.any(String)
    }));
  });

  it('should validate user update data', () => {
    const mockUpdateData: IUserUpdate = {
      industries: ['Technology', 'Finance', 'Healthcare', 'Education'],
      interests: ['AI', 'Machine Learning', 'Data Science', 'Robotics']
    };
    const result = UserValidator.validateUpdate(mockUpdateData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toBeUndefined();
  });
});

describe('Connection Validator Tests', () => {
  const generateMockConnectionData = (): IConnectionCreate => ({
    userId: 'user1',
    connectedUserId: 'user2'
  });

  it('should validate valid connection creation', () => {
    const mockData = generateMockConnectionData();
    const result = validateConnectionCreate(mockData);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it('should prevent self-connections', () => {
    const mockData = generateMockConnectionData();
    mockData.userId = mockData.connectedUserId;
    const result = validateConnectionCreate(mockData);
    expect(result.success).toBe(false);
    expect(result.errors).toContain('Users cannot connect with themselves');
  });

  it('should validate status transitions', () => {
    const mockUpdate = { status: ConnectionStatus.ACCEPTED };
    const result = validateConnectionUpdate(mockUpdate, ConnectionStatus.PENDING);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();

    const invalidResult = validateConnectionUpdate(mockUpdate, ConnectionStatus.BLOCKED);
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.errors).toBeDefined();
  });

  it('should require shared industries', () => {
    const userIndustries = ['Technology', 'Finance'];
    const connectedUserIndustries = ['Finance', 'Healthcare'];
    const sharedIndustries = validateSharedIndustries(userIndustries, connectedUserIndustries);
    expect(sharedIndustries).toEqual(['Finance']);
    expect(sharedIndustries.length).toBeGreaterThan(0);
  });

  it('should calculate network value correctly', () => {
    const sharedIndustriesCount = 2;
    const value = calculateNetworkValue(sharedIndustriesCount);
    const expectedValue = NETWORK_VALUE_PER_CONNECTION * (1 + (sharedIndustriesCount * 0.1));
    expect(value).toBeCloseTo(expectedValue);
  });
});

describe('Invite Validator Tests', () => {
  const generateMockInviteData = (): IInviteCreate => ({
    userId: 'user1',
    name: 'Test Invite'
  });

  it('should validate valid invite creation', () => {
    const mockData = generateMockInviteData();
    const result = validateInviteCreate(mockData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  it('should validate invite name constraints', () => {
    const mockData = generateMockInviteData();
    mockData.name = 'a'.repeat(51); // Exceeds 50 character limit
    let result = validateInviteCreate(mockData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();

    mockData.name = 'Invalid@Name'; // Contains invalid characters
    result = validateInviteCreate(mockData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toBeDefined();
  });

  it('should validate invite code format', () => {
    const validCode = 'abcd1234';
    const invalidCode = 'invalid!';
    
    const validResult = validateInviteCode(validCode);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toBeUndefined();

    const invalidResult = validateInviteCode(invalidCode);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toBeDefined();
  });

  it('should validate invite updates', () => {
    const mockUpdateData: IInviteUpdate = {
      name: 'Updated Invite Name',
      isActive: false
    };
    const result = validateInviteUpdate(mockUpdateData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toBeUndefined();

    const invalidUpdate: IInviteUpdate = {
      name: 'Invalid@Update',
      isActive: 'not a boolean' as any
    };
    const invalidResult = validateInviteUpdate(invalidUpdate);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.errors).toBeDefined();
  });
});

/**
 * This test suite ensures comprehensive validation of user, connection, and invite data
 * across the Pollen8 platform. It addresses key requirements including:
 * 
 * 1. Verified Connections: Testing phone number and connection validation
 * 2. Industry Focus: Verifying industry selection validation
 * 3. Invitation System: Testing invite link validation
 * 
 * The tests cover various scenarios including valid data, edge cases, and error conditions
 * to ensure robust data integrity and adherence to business rules.
 */