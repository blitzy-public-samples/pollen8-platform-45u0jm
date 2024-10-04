import { IIndustry } from '../interfaces/industry.interface';

/**
 * Constant array of industries supported by the Pollen8 platform.
 * @description This array defines the predefined list of industries available for user selection.
 * @requirement Industry Focus (Technical Specification/1.1 System Objectives)
 * @requirement Multi-industry selection (Technical Specification/1.2 Scope/Core Functionalities)
 */
export const INDUSTRIES: IIndustry[] = [
  {
    _id: new ObjectId(), // This would be replaced with actual ObjectIds in a real database
    name: 'Technology',
    description: 'Companies focused on software, hardware, and IT services',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Finance',
    description: 'Financial services, banking, and investment firms',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Healthcare',
    description: 'Medical services, pharmaceuticals, and healthcare technology',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Education',
    description: 'Educational institutions, EdTech, and training services',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new ObjectId(),
    name: 'Manufacturing',
    description: 'Production of goods and industrial processes',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * Array of industry names for quick access and validation.
 * @description This constant provides an easily accessible list of industry names.
 */
export const INDUSTRY_NAMES: string[] = INDUSTRIES.map(industry => industry.name);

/**
 * Minimum number of industries a user can select.
 * @description Enforces the minimum industry selection requirement.
 * @requirement Multi-industry selection (Technical Specification/1.2 Scope/Core Functionalities)
 */
export const MIN_INDUSTRIES: number = 3;

/**
 * Maximum number of industries a user can select.
 * @description Limits the number of industries a user can be associated with.
 * @requirement Multi-industry selection (Technical Specification/1.2 Scope/Core Functionalities)
 */
export const MAX_INDUSTRIES: number = 5;

/**
 * Validates if a given industry name exists in the predefined list of industries.
 * @param industryName - The name of the industry to validate.
 * @returns A boolean indicating whether the industry name is valid.
 */
export function isValidIndustry(industryName: string): boolean {
  return INDUSTRY_NAMES.includes(industryName);
}

/**
 * Retrieves the full industry object by its name.
 * @param name - The name of the industry to retrieve.
 * @returns The industry object if found, undefined otherwise.
 */
export function getIndustryByName(name: string): IIndustry | undefined {
  return INDUSTRIES.find(industry => industry.name === name);
}

/**
 * @fileoverview This file defines the constant values for industries supported by the Pollen8 platform,
 * ensuring consistent industry categorization across the application. It addresses the following requirements:
 * 1. Industry Focus: Defines supported industries for the platform (Technical Specification/1.1 System Objectives)
 * 2. Multi-industry selection: Provides list of industries for user selection (Technical Specification/1.2 Scope/Core Functionalities)
 * 
 * The constants and utility functions in this file facilitate industry-related operations throughout the application,
 * supporting features such as user profile creation, network filtering, and data analytics.
 */