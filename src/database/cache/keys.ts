/**
 * This file defines the cache key structure and generation functions for the Redis caching layer
 * of the Pollen8 platform, ensuring consistent and efficient cache key management across the application.
 * 
 * Requirements addressed:
 * 1. Performance Optimization (Technical Specification/2.2 High-Level Architecture Diagram):
 *    Enables fast data retrieval through structured cache keys
 * 2. Caching Strategy (Technical Specification/2.2 High-Level Architecture Diagram):
 *    Supports the Redis caching layer for improved response times
 */

import { COLLECTIONS } from '../constants/collections';

// Global constants for cache key generation
export const CACHE_KEY_PREFIX = 'pollen8:';
export const CACHE_KEY_SEPARATOR = ':';

/**
 * Enumeration of different types of cache keys for type safety
 */
export enum CacheKeyType {
  USER = 'user',
  NETWORK = 'network',
  INVITE = 'invite',
  INDUSTRY_LIST = 'industries',
  INTEREST_LIST = 'interests'
}

/**
 * Generates a cache key for user-related data
 * @param userId - The unique identifier of the user
 * @returns Generated cache key for user data
 */
export function generateUserKey(userId: string): string {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided for cache key generation');
  }
  return `${CACHE_KEY_PREFIX}${CacheKeyType.USER}${CACHE_KEY_SEPARATOR}${userId}`;
}

/**
 * Generates a cache key for user's network data
 * @param userId - The unique identifier of the user
 * @returns Generated cache key for network data
 */
export function generateNetworkKey(userId: string): string {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId provided for network cache key generation');
  }
  return `${CACHE_KEY_PREFIX}${CacheKeyType.NETWORK}${CACHE_KEY_SEPARATOR}${userId}`;
}

/**
 * Generates a cache key for invite-related data
 * @param inviteId - The unique identifier of the invite
 * @returns Generated cache key for invite data
 */
export function generateInviteKey(inviteId: string): string {
  if (!inviteId || typeof inviteId !== 'string') {
    throw new Error('Invalid inviteId provided for cache key generation');
  }
  return `${CACHE_KEY_PREFIX}${CacheKeyType.INVITE}${CACHE_KEY_SEPARATOR}${inviteId}`;
}

/**
 * Generates a cache key for the list of industries
 * @returns Generated cache key for industry list
 */
export function generateIndustryListKey(): string {
  return `${CACHE_KEY_PREFIX}${CacheKeyType.INDUSTRY_LIST}`;
}

/**
 * Generates a cache key for the list of interests
 * @returns Generated cache key for interest list
 */
export function generateInterestListKey(): string {
  return `${CACHE_KEY_PREFIX}${CacheKeyType.INTEREST_LIST}`;
}

/**
 * Parses a cache key into its components for debugging and management
 * @param key - The cache key to parse
 * @returns Object containing prefix, type, and optional id from the parsed key
 */
export function parseKey(key: string): { prefix: string; type: string; id?: string } {
  const parts = key.split(CACHE_KEY_SEPARATOR);
  return {
    prefix: parts[0],
    type: parts[1],
    id: parts[2]
  };
}

/**
 * Generates a cache key for a specific collection and document ID
 * @param collectionName - The name of the collection
 * @param documentId - The unique identifier of the document
 * @returns Generated cache key for the specific document
 */
export function generateCollectionDocumentKey(collectionName: keyof typeof COLLECTIONS, documentId: string): string {
  if (!COLLECTIONS[collectionName]) {
    throw new Error(`Invalid collection name: ${collectionName}`);
  }
  if (!documentId || typeof documentId !== 'string') {
    throw new Error('Invalid documentId provided for cache key generation');
  }
  return `${CACHE_KEY_PREFIX}${COLLECTIONS[collectionName]}${CACHE_KEY_SEPARATOR}${documentId}`;
}

/**
 * Generates a cache key for a collection's query result
 * @param collectionName - The name of the collection
 * @param queryHash - A hash representing the query parameters
 * @returns Generated cache key for the query result
 */
export function generateQueryResultKey(collectionName: keyof typeof COLLECTIONS, queryHash: string): string {
  if (!COLLECTIONS[collectionName]) {
    throw new Error(`Invalid collection name: ${collectionName}`);
  }
  if (!queryHash || typeof queryHash !== 'string') {
    throw new Error('Invalid queryHash provided for cache key generation');
  }
  return `${CACHE_KEY_PREFIX}${COLLECTIONS[collectionName]}${CACHE_KEY_SEPARATOR}query${CACHE_KEY_SEPARATOR}${queryHash}`;
}