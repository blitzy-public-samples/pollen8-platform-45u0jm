import React, { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { validatePhoneNumber } from '../../utils/validation';

/**
 * Interface defining the component's state
 */
interface PhoneVerificationState {
  phoneNumber: string;
  error: string | null;
  isSubmitting: boolean;
}

/**
 * PhoneVerification Component
 * 
 * A React component that implements the initial phone number input and verification
 * request for the Pollen8 platform's authentication process, adhering to the
 * minimalist black and white design aesthetic.
 * 
 * Requirements addressed:
 * - Verified Connections (Technical Specification/1.1 System Objectives): Implements phone number verification system
 * - User-Centric Design (Technical Specification/1.1 System Objectives): Delivers intuitive, modern user experience
 * - Enhanced Privacy (Technical Specification/1.2 Scope/Benefits): Initiates phone verification for improved network quality
 * 
 * @returns {JSX.Element} The rendered component
 */
export const PhoneVerification: React.FC = () => {
  // Initialize state using useState hook
  const [state, setState] = useState<PhoneVerificationState>({
    phoneNumber: '',
    error: null,
    isSubmitting: false,
  });

  // Get authentication methods from useAuth hook
  const { verifyPhoneNumber } = useAuth();

  /**
   * Handles phone number input changes
   * @param event - The input change event
   */
  const handlePhoneChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.replace(/\D/g, ''); // Remove non-numeric characters
    setState(prevState => ({
      ...prevState,
      phoneNumber: value,
      error: null, // Clear any existing error
    }));
  }, []);

  /**
   * Handles form submission and initiates verification
   * @param event - The form submission event
   */
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const { phoneNumber } = state;

    // Validate phone number
    const validationResult = validatePhoneNumber(phoneNumber);
    if (!validationResult.isValid) {
      setState(prevState => ({
        ...prevState,
        error: validationResult.error || 'Invalid phone number',
      }));
      return;
    }

    // Set loading state
    setState(prevState => ({ ...prevState, isSubmitting: true, error: null }));

    try {
      // Attempt to verify phone number
      await verifyPhoneNumber(phoneNumber);
      // Handle success (navigation to next step would typically happen here)
    } catch (error) {
      // Handle error states
      setState(prevState => ({
        ...prevState,
        error: 'Failed to send verification code. Please try again.',
        isSubmitting: false,
      }));
    }
  }, [state.phoneNumber, verifyPhoneNumber]);

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-6 text-center">Phone Verification</h2>
      <form onSubmit={handleSubmit}>
        <Input
          type="tel"
          variant="phone"
          label="Phone Number"
          value={state.phoneNumber}
          onChange={handlePhoneChange}
          placeholder="Enter your phone number"
          fullWidth
          error={state.error || undefined}
        />
        <Button
          type="submit"
          variant="primary"
          size="large"
          isLoading={state.isSubmitting}
          fullWidth
          className="mt-4"
        >
          Verify Phone Number
        </Button>
      </form>
    </div>
  );
};

export default PhoneVerification;