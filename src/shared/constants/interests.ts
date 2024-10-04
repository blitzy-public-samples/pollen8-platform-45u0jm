import { IInterest } from '../interfaces/interest.interface';

/**
 * Constant array of predefined interests supported by the Pollen8 platform.
 * This array addresses the following requirements:
 * 1. User-Centric Design: Define supported interests for personalized networking (Technical Specification/1.1 System Objectives)
 * 2. Multi-interest Selection: Support selection of multiple interests per user (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 * 3. Industry Focus: Complement industry selection with related interests (Technical Specification/1.2 Scope/Core Functionalities)
 */
export const INTERESTS: IInterest[] = [
  { _id: new ObjectId(), name: 'Artificial Intelligence', category: 'Technology', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Blockchain', category: 'Technology', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Machine Learning', category: 'Technology', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Data Science', category: 'Technology', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Cybersecurity', category: 'Technology', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Cloud Computing', category: 'Technology', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'IoT', category: 'Technology', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Fintech', category: 'Finance', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Investment Banking', category: 'Finance', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Venture Capital', category: 'Finance', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Cryptocurrency', category: 'Finance', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'EdTech', category: 'Education', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Online Learning', category: 'Education', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'STEM Education', category: 'Education', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Digital Marketing', category: 'Marketing', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Content Marketing', category: 'Marketing', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'SEO', category: 'Marketing', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Social Media Marketing', category: 'Marketing', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Entrepreneurship', category: 'Business', createdAt: new Date(), updatedAt: new Date() },
  { _id: new ObjectId(), name: 'Startups', category: 'Business', createdAt: new Date(), updatedAt: new Date() },
];

/**
 * Constant array of unique interest categories.
 * This array is derived from the INTERESTS array and provides a quick reference for all available categories.
 */
export const INTEREST_CATEGORIES: string[] = [...new Set(INTERESTS.map(interest => interest.category))];

/**
 * Constant array of all interest names.
 * This array is derived from the INTERESTS array and provides a quick reference for all available interest names.
 */
export const INTEREST_NAMES: string[] = INTERESTS.map(interest => interest.name);

/**
 * Minimum number of interests a user must select.
 * This constant enforces the requirement for users to select multiple interests (Technical Specification/1.2 Scope/User Authentication and Profile Management).
 */
export const MIN_INTERESTS: number = 3;

/**
 * Maximum number of interests a user can select.
 * This constant helps maintain a focused user profile while still allowing for diverse interests.
 */
export const MAX_INTERESTS: number = 7;

/**
 * Validates if a given interest name exists in the predefined list of interests.
 * @param interestName - The name of the interest to validate.
 * @returns A boolean indicating whether the interest name is valid.
 */
export function isValidInterest(interestName: string): boolean {
  return INTEREST_NAMES.includes(interestName);
}

/**
 * Retrieves the full interest object by its name.
 * @param name - The name of the interest to retrieve.
 * @returns The interest object if found, undefined otherwise.
 */
export function getInterestByName(name: string): IInterest | undefined {
  return INTERESTS.find(interest => interest.name === name);
}

/**
 * Retrieves all interests belonging to a specific category.
 * @param category - The category to filter interests by.
 * @returns An array of interests in the specified category.
 */
export function getInterestsByCategory(category: string): IInterest[] {
  return INTERESTS.filter(interest => interest.category === category);
}

/**
 * @fileoverview This file defines the constant values for interests supported by the Pollen8 platform,
 * ensuring consistent interest categorization and selection across the application.
 * It addresses the following requirements:
 * 1. User-Centric Design: Define supported interests for personalized networking (Technical Specification/1.1 System Objectives)
 * 2. Multi-interest Selection: Support selection of multiple interests per user (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 * 3. Industry Focus: Complement industry selection with related interests (Technical Specification/1.2 Scope/Core Functionalities)
 * 
 * The constants and functions in this file provide a centralized source of truth for all interest-related data,
 * facilitating consistent interest management throughout the Pollen8 platform.
 */