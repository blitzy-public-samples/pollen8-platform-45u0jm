import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, AuthResponse, NetworkResponse, PhoneVerificationRequest, VerificationConfirmRequest } from '@shared/types/api.types';
import { IUser } from '@shared/interfaces/user.interface';
import { validatePhoneNumber } from '@frontend/utils/validation';
import { ERROR_CODES, ERROR_MESSAGES } from '@shared/constants/errorCodes';

// Global constants
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.pollen8.com';
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * ApiService class provides methods for all API interactions in the Pollen8 platform
 * @class ApiService
 * @description Singleton class for centralized API client management
 * @requirements Verified Connections, Industry Focus, Quantifiable Networking, User-Centric Design (Technical Specification/1.1 System Objectives)
 */
class ApiService {
  private static instance: ApiService;
  private token: string = '';

  private constructor() {
    this.initializeApiClient();
  }

  /**
   * Get the singleton instance of ApiService
   * @returns {ApiService} The ApiService instance
   */
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  /**
   * Initialize the Axios instance with default configuration and interceptors
   * @private
   */
  private initializeApiClient(): void {
    apiClient.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers['Authorization'] = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const errorCode = error.response.data.errorCode || ERROR_CODES.UNKNOWN_ERROR;
          const errorMessage = ERROR_MESSAGES[errorCode] || error.response.data.message || 'An unknown error occurred';
          return Promise.reject({ code: errorCode, message: errorMessage });
        }
        return Promise.reject({ code: ERROR_CODES.NETWORK_ERROR, message: ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR] });
      }
    );
  }

  /**
   * Set the authentication token for subsequent requests
   * @param {string} token - The JWT token to be used for authentication
   */
  public setAuthToken(token: string): void {
    this.token = token;
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Initiate the phone verification process
   * @param {string} phoneNumber - The phone number to be verified
   * @returns {Promise<ApiResponse<string>>} A promise that resolves to the verification ID
   */
  public async verifyPhoneNumber(phoneNumber: string): Promise<ApiResponse<string>> {
    const validationResult = validatePhoneNumber(phoneNumber);
    if (!validationResult.isValid) {
      throw new Error(validationResult.error);
    }

    const request: PhoneVerificationRequest = { phoneNumber: validationResult.formattedValue! };
    try {
      const response: AxiosResponse<ApiResponse<string>> = await apiClient.post('/auth/verify', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to initiate phone verification');
    }
  }

  /**
   * Confirm the phone verification code
   * @param {string} verificationId - The verification ID received from the verifyPhoneNumber call
   * @param {string} code - The verification code received via SMS
   * @returns {Promise<ApiResponse<AuthResponse>>} A promise that resolves to the authentication response
   */
  public async confirmVerification(verificationId: string, code: string): Promise<ApiResponse<AuthResponse>> {
    const request: VerificationConfirmRequest = { verificationId, code };
    try {
      const response: AxiosResponse<ApiResponse<AuthResponse>> = await apiClient.post('/auth/confirm', request);
      if (response.data.success && response.data.data.token) {
        this.setAuthToken(response.data.data.token);
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to confirm verification code');
    }
  }

  /**
   * Retrieve user's network data including connections and network value
   * @returns {Promise<ApiResponse<NetworkResponse>>} A promise that resolves to the network data
   */
  public async getNetworkData(): Promise<ApiResponse<NetworkResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<NetworkResponse>> = await apiClient.get('/network/data');
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to retrieve network data');
    }
  }

  /**
   * Update user profile information
   * @param {Partial<IUser>} userData - The user data to be updated
   * @returns {Promise<ApiResponse<IUser>>} A promise that resolves to the updated user data
   */
  public async updateUserProfile(userData: Partial<IUser>): Promise<ApiResponse<IUser>> {
    try {
      const response: AxiosResponse<ApiResponse<IUser>> = await apiClient.put('/user/profile', userData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update user profile');
    }
  }

  /**
   * Generate a new invite link
   * @param {string} name - The name or description for the invite link
   * @returns {Promise<ApiResponse<string>>} A promise that resolves to the generated invite link
   */
  public async generateInviteLink(name: string): Promise<ApiResponse<string>> {
    try {
      const response: AxiosResponse<ApiResponse<string>> = await apiClient.post('/invite/generate', { name });
      return response.data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to generate invite link');
    }
  }
}

export default ApiService.getInstance();

/**
 * @fileoverview This module provides a centralized API client for making HTTP requests to the Pollen8 backend.
 * It handles authentication, request/response formatting, and error management.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives): Handle phone verification API calls
 * - Industry Focus (Technical Specification/1.1 System Objectives): Manage industry-specific network requests
 * - Quantifiable Networking (Technical Specification/1.1 System Objectives): Fetch and update network value data
 * - User-Centric Design (Technical Specification/1.1 System Objectives): Provide consistent error handling and feedback
 */