import dotenv from 'dotenv';
import { GeolocationConfig } from '../../shared/interfaces/geolocation.interface';

// Load environment variables
dotenv.config();

// Constants
const DEFAULT_REGION = 'US';
const GEOCODING_API_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json';

/**
 * Creates and returns a configuration object for geolocation services
 * @returns {GeolocationConfig} Configuration object for geolocation services
 * @throws {Error} If required environment variables are missing
 */
const createGeolocationConfig = (): GeolocationConfig => {
  // Validate required environment variables
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY is not set in the environment variables');
  }

  const cacheTTL = parseInt(process.env.GEOLOCATION_CACHE_TTL || '3600', 10);
  if (isNaN(cacheTTL)) {
    throw new Error('GEOLOCATION_CACHE_TTL must be a valid number');
  }

  // Create and return immutable configuration object
  return Object.freeze({
    apiKey,
    cacheTTL,
    defaultRegion: DEFAULT_REGION,
    apiEndpoint: GEOCODING_API_ENDPOINT,
  });
};

// Create the geolocation configuration
const geolocationConfig: GeolocationConfig = createGeolocationConfig();

// Export the configuration
export default geolocationConfig;

// Export constants for use in other parts of the application
export { DEFAULT_REGION, GEOCODING_API_ENDPOINT };

// Export the GeolocationConfig interface for type checking in other files
export type { GeolocationConfig };
```

This implementation addresses the following requirements and features:

1. It imports `dotenv` to load environment variables, as specified in the dependencies.
2. It defines the `GeolocationConfig` interface (which should be defined in a shared interfaces file).
3. It implements the `createGeolocationConfig` function as specified, which:
   - Loads environment variables
   - Validates required environment variables
   - Creates and returns an immutable configuration object
4. It defines the constants `DEFAULT_REGION` and `GEOCODING_API_ENDPOINT` as specified.
5. It exports the created `geolocationConfig` as the default export.
6. It also exports the constants and the `GeolocationConfig` interface for use in other parts of the application.
7. It implements error handling for missing or invalid environment variables.
8. The configuration object is created using `Object.freeze()` to ensure immutability.

This implementation provides a robust, type-safe, and configurable geolocation configuration for the Pollen8 platform. It centralizes all geolocation-related configuration and ensures that sensitive data (like API keys) is loaded from environment variables.

To use this configuration in other parts of the application, you can import it like this:

```typescript
import geolocationConfig from '../config/geolocation';