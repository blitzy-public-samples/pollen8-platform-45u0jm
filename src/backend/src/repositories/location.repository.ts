import { Model } from 'mongoose';
import { ILocation, ICoordinates } from '@shared/interfaces/location.interface';
import { IRepository } from '@database/interfaces/repository.interface';

/**
 * Repository class for handling location data persistence and retrieval operations in the Pollen8 platform.
 * @description This class implements the repository pattern for location data management
 * @implements {IRepository<ILocation>}
 */
export class LocationRepository implements IRepository<ILocation> {
  /**
   * @param {Model<ILocation>} model - Mongoose model for location operations
   */
  constructor(private model: Model<ILocation>) {}

  /**
   * Retrieves a location by its ZIP code
   * @param {string} zipCode - The ZIP code to search for
   * @returns {Promise<ILocation | null>} The found location or null if not found
   */
  async findByZipCode(zipCode: string): Promise<ILocation | null> {
    // Validate ZIP code format
    if (!this.isValidZipCode(zipCode)) {
      throw new Error('Invalid ZIP code format');
    }

    // Query database using model.findOne
    const location = await this.model.findOne({ zipCode });

    // Return found location or null
    return location;
  }

  /**
   * Finds locations within a specified radius of given coordinates
   * @param {ICoordinates} coordinates - The center coordinates for the search
   * @param {number} maxDistance - The maximum distance in meters
   * @returns {Promise<ILocation[]>} Array of locations within the specified radius
   */
  async findNearby(coordinates: ICoordinates, maxDistance: number): Promise<ILocation[]> {
    // Validate coordinates
    if (!this.isValidCoordinates(coordinates)) {
      throw new Error('Invalid coordinates');
    }

    // Use $geoNear operator for spatial query
    const nearbyLocations = await this.model.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
          distanceField: 'distance',
          maxDistance,
          spherical: true,
        },
      },
    ]);

    // Return array of nearby locations
    return nearbyLocations;
  }

  /**
   * Creates a new location entry in the database
   * @param {ILocation} locationData - The location data to be created
   * @returns {Promise<ILocation>} The created location document
   */
  async create(locationData: ILocation): Promise<ILocation> {
    // Validate location data
    if (!this.isValidLocationData(locationData)) {
      throw new Error('Invalid location data');
    }

    // Check for existing ZIP code
    const existingLocation = await this.findByZipCode(locationData.zipCode);
    if (existingLocation) {
      throw new Error('Location with this ZIP code already exists');
    }

    // Create new location document
    const newLocation = new this.model(locationData);
    await newLocation.save();

    // Return created location
    return newLocation;
  }

  /**
   * Updates an existing location entry
   * @param {string} zipCode - The ZIP code of the location to update
   * @param {Partial<ILocation>} locationData - The partial location data to update
   * @returns {Promise<ILocation | null>} The updated location or null if not found
   */
  async update(zipCode: string, locationData: Partial<ILocation>): Promise<ILocation | null> {
    // Validate ZIP code and update data
    if (!this.isValidZipCode(zipCode) || !this.isValidPartialLocationData(locationData)) {
      throw new Error('Invalid ZIP code or update data');
    }

    // Find and update location document
    const updatedLocation = await this.model.findOneAndUpdate(
      { zipCode },
      { $set: locationData },
      { new: true }
    );

    // Return updated location or null
    return updatedLocation;
  }

  /**
   * Deletes a location entry from the database
   * @param {string} zipCode - The ZIP code of the location to delete
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(zipCode: string): Promise<boolean> {
    // Validate ZIP code
    if (!this.isValidZipCode(zipCode)) {
      throw new Error('Invalid ZIP code');
    }

    // Attempt to delete location document
    const result = await this.model.deleteOne({ zipCode });

    // Return success status
    return result.deletedCount === 1;
  }

  /**
   * Validates ZIP code format
   * @param {string} zipCode - The ZIP code to validate
   * @returns {boolean} True if valid, false otherwise
   */
  private isValidZipCode(zipCode: string): boolean {
    // Implement ZIP code validation logic
    // This is a simple example and should be replaced with more robust validation
    return /^\d{5}(-\d{4})?$/.test(zipCode);
  }

  /**
   * Validates coordinates
   * @param {ICoordinates} coordinates - The coordinates to validate
   * @returns {boolean} True if valid, false otherwise
   */
  private isValidCoordinates(coordinates: ICoordinates): boolean {
    return (
      typeof coordinates.latitude === 'number' &&
      typeof coordinates.longitude === 'number' &&
      coordinates.latitude >= -90 &&
      coordinates.latitude <= 90 &&
      coordinates.longitude >= -180 &&
      coordinates.longitude <= 180
    );
  }

  /**
   * Validates location data
   * @param {ILocation} locationData - The location data to validate
   * @returns {boolean} True if valid, false otherwise
   */
  private isValidLocationData(locationData: ILocation): boolean {
    return (
      typeof locationData.city === 'string' &&
      this.isValidZipCode(locationData.zipCode) &&
      this.isValidCoordinates(locationData.coordinates)
    );
  }

  /**
   * Validates partial location data for updates
   * @param {Partial<ILocation>} locationData - The partial location data to validate
   * @returns {boolean} True if valid, false otherwise
   */
  private isValidPartialLocationData(locationData: Partial<ILocation>): boolean {
    return (
      (locationData.city === undefined || typeof locationData.city === 'string') &&
      (locationData.zipCode === undefined || this.isValidZipCode(locationData.zipCode)) &&
      (locationData.coordinates === undefined || this.isValidCoordinates(locationData.coordinates))
    );
  }
}