import { GoogleMapsService } from '@services/googleMaps.service';
import { LocationRepository } from '@repositories/location.repository';
import { ILocation } from '@shared/interfaces/location.interface';
import geolocationConfig from '@config/geolocation';
import axios from 'axios';
import Redis from 'ioredis-mock';
import MockAdapter from 'axios-mock-adapter';

jest.mock('@repositories/location.repository');
jest.mock('@config/geolocation', () => ({
  apiKey: 'test-api-key',
  apiEndpoint: 'https://maps.googleapis.com/maps/api/geocode/json',
  cacheTTL: 3600
}));

describe('GoogleMapsService', () => {
  let googleMapsService: GoogleMapsService;
  let locationRepositoryMock: jest.Mocked<LocationRepository>;
  let redisMock: Redis;
  let axiosMock: MockAdapter;

  beforeEach(() => {
    locationRepositoryMock = new LocationRepository() as jest.Mocked<LocationRepository>;
    redisMock = new Redis();
    axiosMock = new MockAdapter(axios);
    googleMapsService = new GoogleMapsService(locationRepositoryMock, redisMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
    axiosMock.reset();
  });

  describe('validateAndGeocodeZipCode', () => {
    const validZipCode = '10001';
    const validGeocodeResponse = {
      results: [
        {
          address_components: [
            { types: ['postal_code'], long_name: '10001' },
            { types: ['locality'], long_name: 'New York' }
          ],
          geometry: {
            location: { lat: 40.7505, lng: -73.9965 }
          }
        }
      ],
      status: 'OK'
    };

    it('should successfully validate and geocode a valid ZIP code', async () => {
      axiosMock.onGet(geolocationConfig.apiEndpoint).reply(200, validGeocodeResponse);
      locationRepositoryMock.create.mockResolvedValue(undefined);

      const result = await googleMapsService.validateAndGeocodeZipCode(validZipCode);

      expect(result).toEqual({
        zipCode: '10001',
        city: 'New York',
        coordinates: { latitude: 40.7505, longitude: -73.9965 }
      });
      expect(locationRepositoryMock.create).toHaveBeenCalledWith(result);
    });

    it('should return cached result for previously geocoded ZIP code', async () => {
      const cachedLocation: ILocation = {
        zipCode: '10001',
        city: 'New York',
        coordinates: { latitude: 40.7505, longitude: -73.9965 }
      };
      await redisMock.set('geocode:10001', JSON.stringify(cachedLocation));

      const result = await googleMapsService.validateAndGeocodeZipCode(validZipCode);

      expect(result).toEqual(cachedLocation);
      expect(axiosMock.history.get.length).toBe(0);
      expect(locationRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('should handle invalid ZIP code error from Google Maps API', async () => {
      const errorResponse = {
        results: [],
        status: 'ZERO_RESULTS',
        error_message: 'ZIP code not found'
      };
      axiosMock.onGet(geolocationConfig.apiEndpoint).reply(200, errorResponse);

      await expect(googleMapsService.validateAndGeocodeZipCode('99999')).rejects.toThrow('Geocoding failed: ZERO_RESULTS');
    });

    it('should handle network errors gracefully', async () => {
      axiosMock.onGet(geolocationConfig.apiEndpoint).networkError();

      await expect(googleMapsService.validateAndGeocodeZipCode(validZipCode)).rejects.toThrow('No response received from Google Maps API');
    });

    it('should retry on transient failures', async () => {
      axiosMock.onGet(geolocationConfig.apiEndpoint)
        .replyOnce(500)
        .replyOnce(200, validGeocodeResponse);

      const result = await googleMapsService.validateAndGeocodeZipCode(validZipCode);

      expect(result).toEqual({
        zipCode: '10001',
        city: 'New York',
        coordinates: { latitude: 40.7505, longitude: -73.9965 }
      });
      expect(axiosMock.history.get.length).toBe(2);
    });
  });

  describe('findNearbyLocations', () => {
    const validCoordinates = { latitude: 40.7505, longitude: -73.9965 };
    const radius = 5000;

    it('should return locations within specified radius', async () => {
      const nearbyLocations: ILocation[] = [
        { zipCode: '10001', city: 'New York', coordinates: { latitude: 40.7505, longitude: -73.9965 } },
        { zipCode: '10002', city: 'New York', coordinates: { latitude: 40.7605, longitude: -73.9865 } }
      ];
      locationRepositoryMock.findNearby.mockResolvedValue(nearbyLocations);

      const result = await googleMapsService.findNearbyLocations(validCoordinates, radius);

      expect(result).toEqual(nearbyLocations);
      expect(locationRepositoryMock.findNearby).toHaveBeenCalledWith(validCoordinates, radius);
    });

    it('should handle empty results', async () => {
      locationRepositoryMock.findNearby.mockResolvedValue([]);

      const result = await googleMapsService.findNearbyLocations(validCoordinates, radius);

      expect(result).toEqual([]);
    });

    it('should respect the provided radius parameter', async () => {
      await googleMapsService.findNearbyLocations(validCoordinates, 10000);

      expect(locationRepositoryMock.findNearby).toHaveBeenCalledWith(validCoordinates, 10000);
    });

    it('should handle API errors gracefully', async () => {
      locationRepositoryMock.findNearby.mockRejectedValue(new Error('Database error'));

      await expect(googleMapsService.findNearbyLocations(validCoordinates, radius)).rejects.toThrow('Database error');
    });
  });

  describe('getCityFromZipCode', () => {
    const validZipCode = '10001';

    it('should return correct city name for valid ZIP code', async () => {
      const cachedLocation: ILocation = {
        zipCode: '10001',
        city: 'New York',
        coordinates: { latitude: 40.7505, longitude: -73.9965 }
      };
      await redisMock.set('geocode:10001', JSON.stringify(cachedLocation));

      const result = await googleMapsService.getCityFromZipCode(validZipCode);

      expect(result).toBe('New York');
    });

    it('should handle ZIP code not found', async () => {
      axiosMock.onGet(geolocationConfig.apiEndpoint).reply(200, {
        results: [],
        status: 'ZERO_RESULTS'
      });

      await expect(googleMapsService.getCityFromZipCode('99999')).rejects.toThrow('Geocoding failed: ZERO_RESULTS');
    });

    it('should use cached city data when available', async () => {
      const cachedLocation: ILocation = {
        zipCode: '10001',
        city: 'New York',
        coordinates: { latitude: 40.7505, longitude: -73.9965 }
      };
      await redisMock.set('geocode:10001', JSON.stringify(cachedLocation));

      const result = await googleMapsService.getCityFromZipCode(validZipCode);

      expect(result).toBe('New York');
      expect(axiosMock.history.get.length).toBe(0);
    });
  });
});