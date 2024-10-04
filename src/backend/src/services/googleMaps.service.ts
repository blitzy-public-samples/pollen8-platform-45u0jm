import axios from 'axios';
import Redis from 'ioredis';
import geolocationConfig from '@config/geolocation';
import { ILocation, ICoordinates } from '@shared/interfaces/location.interface';
import { LocationRepository } from '../repositories/location.repository';

/**
 * Service class that handles integration with the Google Maps API for location validation,
 * geocoding, and standardization of location data in the Pollen8 platform.
 */
export class GoogleMapsService {
  private apiKey: string;
  private apiEndpoint: string;
  private cacheTTL: number;

  /**
   * Initializes the Google Maps service with required dependencies
   * @param locationRepository - Repository for location data persistence
   * @param redisClient - Redis client for caching
   */
  constructor(
    private locationRepository: LocationRepository,
    private redisClient: Redis
  ) {
    this.apiKey = geolocationConfig.apiKey;
    this.apiEndpoint = geolocationConfig.apiEndpoint;
    this.cacheTTL = geolocationConfig.cacheTTL;
  }

  /**
   * Validates a ZIP code and returns standardized location data
   * @param zipCode - The ZIP code to validate and geocode
   * @returns Standardized location data
   */
  async validateAndGeocodeZipCode(zipCode: string): Promise<ILocation> {
    const cacheKey = this.getCacheKey(zipCode);
    const cachedResult = await this.redisClient.get(cacheKey);

    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    try {
      const response = await axios.get(this.apiEndpoint, {
        params: {
          address: zipCode,
          key: this.apiKey,
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Geocoding failed: ${response.data.status}`);
      }

      const result = response.data.results[0];
      const location: ILocation = {
        zipCode,
        city: this.extractCity(result),
        coordinates: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
        },
      };

      await this.redisClient.set(cacheKey, JSON.stringify(location), 'EX', this.cacheTTL);
      await this.locationRepository.create(location);

      return location;
    } catch (error) {
      this.handleGoogleMapsError(error);
    }
  }

  /**
   * Finds locations within a specified radius of given coordinates
   * @param coordinates - The center coordinates for the search
   * @param radius - The radius in meters to search within
   * @returns Array of nearby locations
   */
  async findNearbyLocations(coordinates: ICoordinates, radius: number): Promise<ILocation[]> {
    if (!this.isValidCoordinates(coordinates)) {
      throw new Error('Invalid coordinates');
    }

    return this.locationRepository.findNearby(coordinates, radius);
  }

  /**
   * Retrieves the city name for a given ZIP code
   * @param zipCode - The ZIP code to get the city for
   * @returns The city name
   */
  async getCityFromZipCode(zipCode: string): Promise<string> {
    const cacheKey = this.getCacheKey(zipCode);
    const cachedResult = await this.redisClient.get(cacheKey);

    if (cachedResult) {
      const location: ILocation = JSON.parse(cachedResult);
      return location.city;
    }

    const location = await this.validateAndGeocodeZipCode(zipCode);
    return location.city;
  }

  /**
   * Generates a cache key for Redis storage
   * @param zipCode - The ZIP code to generate a key for
   * @returns Formatted cache key string
   */
  private getCacheKey(zipCode: string): string {
    return `geocode:${zipCode.toLowerCase()}`;
  }

  /**
   * Handles and transforms Google Maps API errors
   * @param error - The error to handle
   * @throws Standardized error
   */
  private handleGoogleMapsError(error: any): never {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(`Google Maps API error: ${error.response.data.error_message}`);
      } else if (error.request) {
        throw new Error('No response received from Google Maps API');
      }
    }
    throw new Error('An unexpected error occurred while querying Google Maps API');
  }

  /**
   * Extracts the city name from a Google Maps API result
   * @param result - The Google Maps API result
   * @returns The extracted city name
   */
  private extractCity(result: any): string {
    const cityComponent = result.address_components.find(
      (component: any) => component.types.includes('locality')
    );
    return cityComponent ? cityComponent.long_name : 'Unknown';
  }

  /**
   * Validates coordinates
   * @param coordinates - The coordinates to validate
   * @returns True if valid, false otherwise
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
}