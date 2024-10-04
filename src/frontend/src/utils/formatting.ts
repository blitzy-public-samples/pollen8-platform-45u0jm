import { format } from 'date-fns';
import { parsePhoneNumber } from 'libphonenumber-js';
import { NETWORK_VALUE_PER_CONNECTION } from '../../shared/constants/networkValue';

/**
 * Default date format constant
 * @description Defines the default format for date strings
 * @requirements User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 */
const DEFAULT_DATE_FORMAT = 'MMM dd, yyyy';

/**
 * Network value decimal places constant
 * @description Defines the number of decimal places for network value formatting
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 */
const NETWORK_VALUE_DECIMALS = 2;

/**
 * Formats a phone number into a consistent, user-friendly format for display in the UI.
 * @param phoneNumber The phone number to format
 * @returns Formatted phone number string
 * @requirements User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  try {
    const parsedNumber = parsePhoneNumber(phoneNumber);
    return parsedNumber.formatInternational();
  } catch (error) {
    console.error('Error formatting phone number:', error);
    return phoneNumber; // Return original number if parsing fails
  }
}

/**
 * Calculates and formats the network value based on the number of connections.
 * @param connections Number of connections
 * @returns Formatted network value string
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 */
export function formatNetworkValue(connections: number): string {
  const value = connections * NETWORK_VALUE_PER_CONNECTION;
  return value.toFixed(NETWORK_VALUE_DECIMALS);
}

/**
 * Formats a date into a consistent string representation for display in the UI.
 * @param date Date to format
 * @param formatString Optional custom format string
 * @returns Formatted date string
 * @requirements User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 */
export function formatDate(date: Date | string, formatString: string = DEFAULT_DATE_FORMAT): string {
  const dateObject = typeof date === 'string' ? new Date(date) : date;
  return format(dateObject, formatString);
}

/**
 * Formats a list of industries into a readable, comma-separated string with proper Oxford comma usage.
 * @param industries Array of industry names
 * @returns Formatted industry list string
 * @requirements Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus)
 */
export function formatIndustryList(industries: string[]): string {
  if (industries.length === 0) return '';
  if (industries.length === 1) return industries[0];
  if (industries.length === 2) return `${industries[0]} and ${industries[1]}`;
  
  const lastIndustry = industries[industries.length - 1];
  const otherIndustries = industries.slice(0, -1).join(', ');
  return `${otherIndustries}, and ${lastIndustry}`;
}

/**
 * Formats a number with commas for thousands separators to improve readability in the UI.
 * @param number Number to format
 * @returns Formatted number string with commas
 * @requirements User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 */
export function formatNumberWithCommas(number: number): string {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * @fileoverview This TypeScript file provides utility functions for formatting various data types
 * in the Pollen8 user interface, ensuring consistent and visually appealing data presentation.
 * 
 * Key requirements addressed:
 * 1. User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 *    - Implemented formatPhoneNumber, formatDate, and formatNumberWithCommas for consistent data formatting
 * 2. Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 *    - Implemented formatNetworkValue for clear display of network values in the UI
 * 3. Industry Focus (Technical Specification/1.1 System Objectives/Industry Focus)
 *    - Implemented formatIndustryList for readable display of industry lists
 */