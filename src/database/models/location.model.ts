import mongoose, { Document, Model, Schema } from 'mongoose';
import { ILocation, ICoordinates } from '../../shared/interfaces/location.interface';
import { IRepository } from '../interfaces/repository.interface';
import { COLLECTIONS } from '../constants/collections';

/**
 * This file defines the MongoDB schema and model for location data in the Pollen8 platform,
 * implementing the location interface and repository pattern for database operations.
 * 
 * Requirements addressed:
 * 1. Location-Aware Profiles (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 * 2. Data-Driven Networking (Technical Specification/1.2 Scope/Benefits)
 * 3. Geolocation Integration (Technical Specification/2.2 High-Level Architecture Diagram)
 */

const LOCATION_COLLECTION = COLLECTIONS.LOCATIONS;

/**
 * Mongoose schema for the Coordinates subdocument
 */
const CoordinatesSchema: Schema<ICoordinates> = new Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true }
}, { _id: false });

/**
 * Mongoose schema for the Location document
 */
const LocationSchema: Schema<ILocation> = new Schema({
  city: { 
    type: String, 
    required: true, 
    trim: true,
    set: normalizeCity
  },
  zipCode: { 
    type: String, 
    required: true, 
    validate: [validateZipCode, 'Invalid ZIP code format']
  },
  coordinates: { 
    type: CoordinatesSchema, 
    required: true 
  }
}, {
  timestamps: true,
  collection: LOCATION_COLLECTION
});

/**
 * Custom validator function to ensure ZIP code format is correct before saving
 * @param zipCode - The ZIP code to validate
 * @returns Whether the ZIP code is valid
 */
function validateZipCode(zipCode: string): boolean {
  // This regex assumes a US ZIP code format. Adjust as needed for international support.
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zipCode);
}

/**
 * Normalizes city names to ensure consistency in the database
 * @param city - The city name to normalize
 * @returns Normalized city name
 */
function normalizeCity(city: string): string {
  return city.trim().replace(/\s+/g, ' ').toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

// Create indexes for frequently queried fields
LocationSchema.index({ city: 1 });
LocationSchema.index({ zipCode: 1 });
LocationSchema.index({ coordinates: '2dsphere' });

/**
 * Interface for the Location document, extending both ILocation and Document
 */
export interface ILocationDocument extends ILocation, Document {}

/**
 * Mongoose model for location documents, used for database operations
 */
export const LocationModel: Model<ILocationDocument> = mongoose.model<ILocationDocument>('Location', LocationSchema);

/**
 * Repository implementation for Location data
 */
export class LocationRepository implements IRepository<ILocationDocument> {
  async find(filter: Partial<ILocation>, options?: any): Promise<ILocationDocument[]> {
    return LocationModel.find(filter, null, options).exec();
  }

  async findOne(filter: Partial<ILocation>, options?: any): Promise<ILocationDocument | null> {
    return LocationModel.findOne(filter, null, options).exec();
  }

  async create(data: Partial<ILocation>): Promise<ILocationDocument> {
    return LocationModel.create(data);
  }

  async update(filter: Partial<ILocation>, data: Partial<ILocation>, options?: any): Promise<ILocationDocument> {
    return LocationModel.findOneAndUpdate(filter, data, { new: true, ...options }).exec();
  }

  async delete(filter: Partial<ILocation>): Promise<boolean> {
    const result = await LocationModel.deleteOne(filter).exec();
    return result.deletedCount > 0;
  }

  async count(filter: Partial<ILocation>): Promise<number> {
    return LocationModel.countDocuments(filter).exec();
  }

  /**
   * Finds locations within a specified radius of a given point
   * @param coordinates - The center point coordinates
   * @param radiusInMiles - The radius to search within, in miles
   * @returns Promise resolving to an array of locations within the specified radius
   */
  async findNearby(coordinates: ICoordinates, radiusInMiles: number): Promise<ILocationDocument[]> {
    return LocationModel.find({
      coordinates: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [coordinates.longitude, coordinates.latitude]
          },
          $maxDistance: radiusInMiles * 1609.34 // Convert miles to meters
        }
      }
    }).exec();
  }
}

export default new LocationRepository();