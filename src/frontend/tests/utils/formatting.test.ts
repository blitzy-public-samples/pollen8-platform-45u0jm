import { describe, it, expect } from '@jest/globals';
import {
  formatPhoneNumber,
  formatNetworkValue,
  formatDate,
  formatIndustryList,
  formatNumberWithCommas
} from '../../src/utils/formatting';

describe('Formatting Utility Functions', () => {
  // Test suite for formatPhoneNumber function
  describe('formatPhoneNumber', () => {
    it('should format a standard US phone number correctly', () => {
      expect(formatPhoneNumber('+12125551234')).toBe('+1 212 555 1234');
    });

    it('should handle international phone numbers', () => {
      expect(formatPhoneNumber('+447911123456')).toBe('+44 7911 123456');
    });

    it('should return the original input for invalid phone numbers', () => {
      const invalidNumber = '12345';
      expect(formatPhoneNumber(invalidNumber)).toBe(invalidNumber);
    });
  });

  // Test suite for formatNetworkValue function
  describe('formatNetworkValue', () => {
    it('should calculate and format network value correctly', () => {
      expect(formatNetworkValue(5)).toBe('15.70');
    });

    it('should handle zero connections', () => {
      expect(formatNetworkValue(0)).toBe('0.00');
    });

    it('should format large network values correctly', () => {
      expect(formatNetworkValue(1000)).toBe('3140.00');
    });
  });

  // Test suite for formatDate function
  describe('formatDate', () => {
    it('should format date with default format', () => {
      const date = new Date('2023-09-15T12:00:00Z');
      expect(formatDate(date)).toBe('Sep 15, 2023');
    });

    it('should handle custom date format', () => {
      const date = new Date('2023-09-15T12:00:00Z');
      expect(formatDate(date, 'yyyy-MM-dd')).toBe('2023-09-15');
    });

    it('should handle string dates', () => {
      expect(formatDate('2023-09-15')).toBe('Sep 15, 2023');
    });

    it('should return an empty string for invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('');
    });
  });

  // Test suite for formatIndustryList function
  describe('formatIndustryList', () => {
    it('should handle a single industry', () => {
      expect(formatIndustryList(['Technology'])).toBe('Technology');
    });

    it('should format two industries with "and"', () => {
      expect(formatIndustryList(['Technology', 'Finance'])).toBe('Technology and Finance');
    });

    it('should use Oxford comma for three or more industries', () => {
      expect(formatIndustryList(['Technology', 'Finance', 'Healthcare'])).toBe('Technology, Finance, and Healthcare');
    });

    it('should handle an empty industry list', () => {
      expect(formatIndustryList([])).toBe('');
    });
  });

  // Test suite for formatNumberWithCommas function
  describe('formatNumberWithCommas', () => {
    it('should add commas to large numbers', () => {
      expect(formatNumberWithCommas(1000000)).toBe('1,000,000');
    });

    it('should handle numbers with decimals', () => {
      expect(formatNumberWithCommas(1234567.89)).toBe('1,234,567.89');
    });

    it('should not add commas to numbers under 1000', () => {
      expect(formatNumberWithCommas(999)).toBe('999');
    });
  });
});

/**
 * @fileoverview This test file contains comprehensive unit tests for the frontend formatting utility functions.
 * It ensures consistent and accurate data presentation across the Pollen8 user interface.
 *
 * Requirements addressed:
 * 1. User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 *    - Tests for formatPhoneNumber, formatDate, and formatNumberWithCommas verify consistent and visually appealing data formatting
 * 2. Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 *    - Tests for formatNetworkValue ensure accurate network value formatting
 * 3. Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus)
 *    - Tests for formatIndustryList validate industry list formatting
 */