import { useContext } from 'react';
import { AuthContext, AuthContextType } from '@frontend/contexts/AuthContext';

/**
 * Custom React hook that provides authentication functionality and state management
 * for the Pollen8 frontend application, leveraging the AuthContext for consistent
 * authentication across the app.
 *
 * @returns {AuthContextType} An object containing authentication state and methods
 * @throws {Error} If used outside of an AuthProvider
 *
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives): Provide authentication logic using phone verification
 * - User-Centric Design (Technical Specification/1.1 System Objectives): Deliver intuitive authentication experience
 * - User Authentication (Technical Specification/1.2 Scope/Core Functionalities): Implement phone number verification system
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/**
 * Interface defining the return type of the useAuth hook
 */
export interface AuthHookResult {
  user: AuthContextType['user'];
  isAuthenticated: boolean;
  isLoading: boolean;
  verificationId: string | null;
  verifyPhoneNumber: (phoneNumber: string) => Promise<void>;
  confirmVerification: (code: string) => Promise<void>;
  logout: () => void;
}

/**
 * @fileoverview This module provides a custom React hook for authentication functionality
 * in the Pollen8 frontend application. It encapsulates the AuthContext and provides
 * a simple interface for components to access authentication state and methods.
 */