import { injectable } from 'inversify';
import { Collection } from 'mongodb';
import { IRepository } from '../interfaces/repository.interface';
import { LocationModel, ILocationDocument } from '../models/location.model';
import { FilterOptions, QueryOptions, UpdateOptions } from '../types/query.types';
import { buildQuery, executeQuery } from '../utils/query.util';

/**
 * Implementation of the location repository for managing location data in the MongoDB database,
 * following the repository pattern and providing location-specific query operations.
 * 
 * Requirements addressed:
 * 1. Location-Aware User Profiles (Technical Specification/1.2 Scope/User Authentication and Profile Management)
 * 2. Geolocation Services (Technical Specification/1.2 Scope/Core Functionalities)
 * 3. Data Layer Implementation (Technical Specification/2.2 High-Level Architecture Diagram/Data Layer)
 */

@injectable()
export class LocationRepository implements IRepository<ILocationDocument> {
  private collection: Collection<ILocationDocument>;
  private model: typeof LocationModel;

  constructor() {
    this.collection = LocationModel.collection;
    this.model = LocationModel;
  }

  /**
   * Retrieves multiple location documents based on filter criteria.
   * @param filter - The filter criteria to apply
   * @param options - Additional query options
   * @returns Promise resolving to an array of location documents
   */
  async find(filter: FilterOptions<ILocationDocument>, options?: QueryOptions): Promise<ILocationDocument[]> {
    const query = buildQuery(filter, options);
    return executeQuery(this.model.find(query), options);
  }

  /**
   * Retrieves a single location document based on filter criteria.
   * @param filter - The filter criteria to apply
   * @param options - Additional query options
   * @returns Promise resolving to a single location document or null
   */
  async findOne(filter: FilterOptions<ILocationDocument>, options?: QueryOptions): Promise<ILocationDocument | null> {
    const query = buildQuery(filter, options);
    return this.model.findOne(query).exec();
  }

  /**
   * Finds a location by ZIP code.
   * @param zipCode - The ZIP code to search for
   * @returns Promise resolving to a location document or null
   */
  async findByZipCode(zipCode: string): Promise<ILocationDocument | null> {
    return this.model.findOne({ zipCode }).exec();
  }

  /**
   * Finds locations within a specified radius of given coordinates.
   * @param latitude - The latitude of the center point
   * @param longitude - The longitude of the center point
   * @param radiusInMiles - The radius to search within, in miles
   * @returns Promise resolving to an array of nearby locations
   */
  async findNearby(latitude: number, longitude: number, radiusInMiles: number): Promise<ILocationDocument[]> {
    return this.model.find({
      coordinates: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude]
          },
          $maxDistance: radiusInMiles * 1609.34 // Convert miles to meters
        }
      }
    }).exec();
  }

  /**
   * Creates a new location document.
   * @param data - The data to create the new location
   * @returns Promise resolving to the created location document
   */
  async create(data: Partial<ILocationDocument>): Promise<ILocationDocument> {
    return this.model.create(data);
  }

  /**
   * Updates an existing location document.
   * @param filter - The filter criteria to find the document to update
   * @param data - The data to update
   * @param options - Additional update options
   * @returns Promise resolving to the updated location document
   */
  async update(filter: FilterOptions<ILocationDocument>, data: Partial<ILocationDocument>, options?: UpdateOptions): Promise<ILocationDocument> {
    const query = buildQuery(filter, options);
    return this.model.findOneAndUpdate(query, data, { new: true, ...options }).exec();
  }

  /**
   * Deletes a location document.
   * @param filter - The filter criteria to find the document to delete
   * @returns Promise resolving to the success status of deletion
   */
  async delete(filter: FilterOptions<ILocationDocument>): Promise<boolean> {
    const query = buildQuery(filter);
    const result = await this.model.deleteOne(query).exec();
    return result.deletedCount > 0;
  }

  /**
   * Counts the number of location documents matching the filter criteria.
   * @param filter - The filter criteria to apply
   * @returns Promise resolving to the count of matching documents
   */
  async count(filter: FilterOptions<ILocationDocument>): Promise<number> {
    const query = buildQuery(filter);
    return this.model.countDocuments(query).exec();
  }
}

export default new LocationRepository();