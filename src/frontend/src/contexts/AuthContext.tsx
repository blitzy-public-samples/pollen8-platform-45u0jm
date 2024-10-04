import React, { createContext, useState, useEffect, useCallback } from 'react';
import ApiService from '@frontend/services/api';
import { IUser } from '@shared/interfaces/user.interface';
import { validatePhoneNumber } from '@frontend/utils/validation';
import { AuthResponse } from '@shared/types/api.types';

interface AuthContextType {
  user: IUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  verificationId: string | null;
  verifyPhoneNumber: (phoneNumber: string) => Promise<void>;
  confirmVerification: (code: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component that manages authentication state and provides authentication-related functionality
 * @param {AuthProviderProps} props - The component props
 * @returns {JSX.Element} The AuthProvider component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing authentication token on component mount
    const token = localStorage.getItem('authToken');
    if (token) {
      ApiService.setAuthToken(token);
      fetchUserProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch user profile data
   */
  const fetchUserProfile = async () => {
    try {
      const response = await ApiService.getNetworkData();
      if (response.success && response.data.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initiate phone number verification process
   * @param {string} phoneNumber - The phone number to verify
   */
  const verifyPhoneNumber = useCallback(async (phoneNumber: string) => {
    setIsLoading(true);
    try {
      const validationResult = validatePhoneNumber(phoneNumber);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error);
      }

      const response = await ApiService.verifyPhoneNumber(validationResult.formattedValue!);
      if (response.success) {
        setVerificationId(response.data);
      } else {
        throw new Error('Phone verification failed');
      }
    } catch (error) {
      console.error('Phone verification error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Confirm verification code and complete authentication
   * @param {string} code - The verification code received via SMS
   */
  const confirmVerification = useCallback(async (code: string) => {
    if (!verificationId) {
      throw new Error('Verification ID is missing');
    }

    setIsLoading(true);
    try {
      const response = await ApiService.confirmVerification(verificationId, code);
      if (response.success) {
        const authResponse = response.data as AuthResponse;
        localStorage.setItem('authToken', authResponse.token);
        ApiService.setAuthToken(authResponse.token);
        setUser(authResponse.user);
        setIsAuthenticated(true);
        setVerificationId(null);
      } else {
        throw new Error('Verification confirmation failed');
      }
    } catch (error) {
      console.error('Verification confirmation error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [verificationId]);

  /**
   * Log out the current user and clear authentication state
   */
  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    ApiService.setAuthToken('');
    setUser(null);
    setIsAuthenticated(false);
    setVerificationId(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    verificationId,
    verifyPhoneNumber,
    confirmVerification,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use the AuthContext
 * @returns {AuthContextType} The AuthContext value
 * @throws {Error} If used outside of an AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * @fileoverview This module provides the AuthContext for managing authentication state and related functionality
 * throughout the Pollen8 frontend application.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives): Manage phone verification state and process
 * - User-Centric Design (Technical Specification/1.1 System Objectives): Provide seamless authentication experience
 * - User Authentication (Technical Specification/1.2 Scope/Core Functionalities): Handle phone number verification system
 */