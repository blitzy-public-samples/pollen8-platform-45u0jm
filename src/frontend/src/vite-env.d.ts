/// <reference types="vite/client" />

/**
 * This file contains TypeScript declarations for Vite-specific environment variables and types used throughout the Pollen8 frontend application.
 * Requirements addressed:
 * - TypeScript Support (Technical Specification/2.1 Programming Languages)
 * - Development Environment (Technical Specification/8.4 Development Environment Setup)
 */

/**
 * Extends the default Vite environment variables interface
 */
interface ImportMetaEnv {
  /**
   * Backend API endpoint URL
   */
  readonly VITE_API_URL: string;

  /**
   * WebSocket server URL
   */
  readonly VITE_SOCKET_URL: string;

  /**
   * Google Maps API key for location services
   */
  readonly VITE_GOOGLE_MAPS_KEY: string;

  /**
   * Current deployment environment
   */
  readonly VITE_ENVIRONMENT: 'development' | 'staging' | 'production';
}

/**
 * Ensures TypeScript recognizes the env property on ImportMeta
 */
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/**
 * Usage notes:
 * - All environment variables must be prefixed with VITE_ to be exposed to the frontend code
 * - This file is automatically included by Vite and doesn't need to be explicitly imported
 * - Custom environment variables should be added to this file to ensure proper TypeScript support
 */