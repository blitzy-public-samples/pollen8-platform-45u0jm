import { format } from 'date-fns';
import { parsePhoneNumber } from 'libphonenumber-js';
import { BASE_CONNECTION_VALUE } from '../constants/networkValue';

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
 * Formats a phone number into a consistent E.164 format for display and verification.
 * @param phoneNumber The phone number to format
 * @returns Formatted phone number in E.164 format
 * @requirements Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 */
export function formatPhoneNumber(phoneNumber: string): string {
  try {
    const parsedNumber = parsePhoneNumber(phoneNumber);
    return parsedNumber.format('E.164');
  } catch (error) {
    console.error('Error formatting phone number:', error);
    return phoneNumber; // Return original input if parsing fails
  }
}

/**
 * Calculates and formats the network value based on the number of connections.
 * @param connections The number of connections in the user's network
 * @returns Formatted network value with appropriate decimal places
 * @requirements Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 */
export function formatNetworkValue(connections: number): string {
  const networkValue = connections * BASE_CONNECTION_VALUE;
  return networkValue.toFixed(NETWORK_VALUE_DECIMALS);
}

/**
 * Formats a date into a consistent string representation.
 * @param date The date to format (Date object or ISO string)
 * @param formatString Optional custom format string
 * @returns Formatted date string
 * @requirements User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 */
export function formatDate(date: Date | string, formatString?: string): string {
  const dateObject = typeof date === 'string' ? new Date(date) : date;
  return format(dateObject, formatString || DEFAULT_DATE_FORMAT);
}

/**
 * Formats a list of industries into a comma-separated string with proper Oxford comma usage.
 * @param industries Array of industry names
 * @returns Formatted comma-separated list of industries
 * @requirements User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
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
 * Formats a number with commas for thousands separators.
 * @param number The number to format
 * @returns Number formatted with commas
 * @requirements User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 */
export function formatNumberWithCommas(number: number): string {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * @fileoverview This module provides utility functions for consistent data formatting across the Pollen8 platform.
 * It addresses requirements for phone number formatting, network value calculation, and general data presentation.
 * 
 * Key requirements addressed:
 * 1. Verified Connections (Technical Specification/1.1 System Objectives/Verified Connections)
 *    - Implemented formatPhoneNumber for consistent E.164 formatting
 * 2. Quantifiable Networking (Technical Specification/1.1 System Objectives/Quantifiable Networking)
 *    - Implemented formatNetworkValue for calculating and formatting network values
 * 3. User-Centric Design (Technical Specification/1.1 System Objectives/User-Centric Design)
 *    - Provided formatDate, formatIndustryList, and formatNumberWithCommas for consistent data presentation
 */