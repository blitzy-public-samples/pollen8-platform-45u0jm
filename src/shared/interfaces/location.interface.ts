/**
 * @fileoverview This file defines the location-related interfaces for the Pollen8 platform.
 * It addresses the following requirements:
 * 1. User-Centric Design: Defines location structure for user profiles (Technical Specification/1.1 System Objectives)
 * 2. Location-Aware Profiles: Provides interface for location data (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 */

/**
 * Defines the structure for location information in the Pollen8 platform
 * @description This interface represents the core location data structure used across the application
 */
export interface ILocation {
  /** The city name */
  city: string;

  /** The ZIP code or postal code */
  zipCode: string;

  /** Geographical coordinates of the location */
  coordinates: ICoordinates;
}

/**
 * Defines the structure for geographical coordinates
 * @description This interface represents the latitude and longitude of a location
 */
export interface ICoordinates {
  /** The latitude coordinate */
  latitude: number;

  /** The longitude coordinate */
  longitude: number;
}

/**
 * Type alias for API responses containing location data
 * @description This type is used for API responses that include location data and optional suggestions
 */
export type LocationResponse = {
  /** The primary location data */
  location: ILocation;

  /** Optional array of suggested locations */
  suggestions?: ILocation[];
};

/**
 * @description This interface extends the ILocation interface to include additional
 * fields that might be useful for internal processing or advanced features
 */
export interface IExtendedLocation extends ILocation {
  /** Optional state or province name */
  state?: string;

  /** Optional country name */
  country?: string;

  /** Optional formatted address string */
  formattedAddress?: string;
}

/**
 * @description This type represents the minimum required fields to create or update a location
 */
export type LocationInput = Pick<ILocation, 'city' | 'zipCode'> & Partial<Pick<ILocation, 'coordinates'>>;

/**
 * @description This enum represents different types of locations that might be used in the application
 */
export enum LocationType {
  Home = 'home',
  Work = 'work',
  Other = 'other'
}

/**
 * @description This interface represents a user's saved location with additional metadata
 */
export interface ISavedLocation extends ILocation {
  /** Unique identifier for the saved location */
  id: string;

  /** User-defined name for the location */
  name: string;

  /** Type of the location */
  type: LocationType;

  /** Timestamp when the location was saved */
  savedAt: Date;
}